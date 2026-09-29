import { afterEach, describe, expect, it, vi } from "vitest";
import { createCentralCollections } from ".";

afterEach(() => {
	vi.unstubAllGlobals();
});

/**
 * The two tables that only grow (#234, #239). They join the one registry like every other table,
 * but sync on demand: a live query's `where` travels to the shape proxy as `subset__*` params and
 * only that slice comes back. Building one must still open no stream, or asking for it would cost
 * a connection before anything reads it — and nothing would ever stop it.
 */
describe.each([
	"publicRequests",
	"mosquitoActivityData",
] as const)("%s", (table) => {
	it("is built on demand, idle, and opens no stream until something reads it", async () => {
		const fetch = vi.fn();
		vi.stubGlobal("fetch", fetch);
		const collections = createCentralCollections("https://api.test");

		const built = (await collections.use(table))[table];

		expect(built.config.syncMode).toBe("on-demand");
		expect(built.status).toBe("idle");
		expect(fetch).not.toHaveBeenCalled();
		await collections.endSession();
	});
});
