import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	requestShape,
	resetDatabase,
	sessionWithRoles,
	type TestSession,
} from "./test/helpers";

let employee: TestSession;

beforeEach(async () => {
	employee = await sessionWithRoles([]);
});

afterEach(resetDatabase);

// #317: a browser that reuses a cached catch-up reports a record created a moment ago as missing.
describe("the shape proxy's cache headers", () => {
	it.each([
		["an initial", "public, max-age=604800, s-maxage=3600"],
		["a catch-up", "public, max-age=60, stale-while-revalidate=300"],
		["a live", "public, max-age=5, stale-while-revalidate=5"],
	])("never lets the browser reuse %s response", async (_, electricCache) => {
		const { headers } = await requestShape("staff_events", employee, {
			headers: { "cache-control": electricCache },
		});

		expect(headers.get("cache-control")).toBe("private, no-cache");
	});

	it("never lets the browser reuse an error from Electric", async () => {
		const { headers, status } = await requestShape("staff_events", employee, {
			headers: { "cache-control": "public, max-age=60" },
			status: 409,
		});

		expect(status).toBe(409);
		expect(headers.get("cache-control")).toBe("private, no-cache");
	});

	it("still passes Electric's sync headers through, varied on the session cookie", async () => {
		const { headers } = await requestShape("staff_events", employee, {
			headers: {
				"electric-handle": "123-456",
				"electric-offset": "0_0",
				"electric-schema": '{"id":{"type":"uuid"}}',
				"electric-up-to-date": "",
			},
		});

		expect(headers.get("electric-handle")).toBe("123-456");
		expect(headers.get("electric-offset")).toBe("0_0");
		expect(headers.get("electric-schema")).toBe('{"id":{"type":"uuid"}}');
		expect(headers.has("electric-up-to-date")).toBe(true);
		expect(headers.get("vary")).toMatch(/\bcookie\b/i);
	});
});
