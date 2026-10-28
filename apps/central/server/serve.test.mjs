import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHandler } from "./serve.mjs";

let dir;
let server;
let origin;

beforeAll(async () => {
	dir = mkdtempSync(join(tmpdir(), "central-serve-"));
	writeFileSync(
		join(dir, "index.html"),
		"<!doctype html><title>central</title>",
	);
	writeFileSync(join(dir, "robots.txt"), "User-agent: *\nDisallow: /\n");
	mkdirSync(join(dir, "assets"));
	writeFileSync(join(dir, "assets", "index-AbC123.js"), "console.log(1)");
	server = createServer(createHandler(dir));
	await new Promise((r) => server.listen(0, "127.0.0.1", r));
	origin = `http://127.0.0.1:${server.address().port}`;
});

afterAll(() => {
	server.close();
	rmSync(dir, { force: true, recursive: true });
});

// A deploy changes index.html but not its URL. Without a Cache-Control the browser guesses a
// freshness from Last-Modified and keeps running the old build until a manual reload.
describe("central's static server", () => {
	it.each([
		"/",
		"/hr/staff-events/123",
		"/index.html",
	])("makes the browser revalidate the app shell at %s", async (path) => {
		const res = await fetch(origin + path);

		expect(res.status).toBe(200);
		expect(await res.text()).toContain("<title>central</title>");
		expect(res.headers.get("cache-control")).toBe("no-cache");
		expect(res.headers.get("etag")).toBeTruthy();
	});

	it("lets the browser keep a hashed asset for a year", async () => {
		const res = await fetch(`${origin}/assets/index-AbC123.js`);

		expect(res.status).toBe(200);
		expect(res.headers.get("cache-control")).toBe(
			"public, max-age=31536000, immutable",
		);
	});

	it("revalidates any other file", async () => {
		const res = await fetch(`${origin}/robots.txt`);

		expect(res.headers.get("cache-control")).toBe("no-cache");
	});

	it("answers an unchanged app shell with 304", async () => {
		const first = await fetch(`${origin}/`);
		const res = await fetch(`${origin}/`, {
			headers: { "if-none-match": first.headers.get("etag") },
		});

		expect(res.status).toBe(304);
	});

	it("404s a missing asset instead of serving the app shell", async () => {
		const res = await fetch(`${origin}/assets/index-gone.js`);

		expect(res.status).toBe(404);
	});
});
