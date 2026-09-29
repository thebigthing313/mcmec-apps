import { describe, expect, it, vi } from "vitest";
import { createCollectionRegistry } from "./registry";

/** Stands in for a TanStack DB collection: all the registry may touch is `cleanup()`. */
function fakeCollection(table: string) {
	return { cleanup: vi.fn(async () => {}), table };
}

/** A fake table set: each definition builds a fresh fake, and records that it did. */
function fakeTables() {
	return {
		meetings: vi.fn(async () => fakeCollection("meetings")),
		notices: vi.fn(async () => fakeCollection("notices")),
	};
}

describe("collection registry", () => {
	it("constructs nothing until a table is asked for", async () => {
		const tables = fakeTables();
		const registry = createCollectionRegistry(tables);

		expect(tables.meetings).not.toHaveBeenCalled();
		expect(tables.notices).not.toHaveBeenCalled();

		const { notices } = await registry.use("notices");

		expect(notices.table).toBe("notices");
		expect(tables.notices).toHaveBeenCalledOnce();
		expect(tables.meetings).not.toHaveBeenCalled();
	});

	it("returns the same instance every time a table is asked for", async () => {
		const tables = fakeTables();
		const registry = createCollectionRegistry(tables);

		const first = await registry.use("notices", "meetings");
		const second = await registry.use("notices");

		expect(second.notices).toBe(first.notices);
		expect(tables.notices).toHaveBeenCalledOnce();
	});

	it("builds one instance when two routes ask at the same time", async () => {
		// A layout's and a child's `beforeLoad` can both be waiting on the same table's import.
		const tables = fakeTables();
		const registry = createCollectionRegistry(tables);

		const [layout, child] = await Promise.all([
			registry.use("notices"),
			registry.use("notices", "meetings"),
		]);

		expect(child.notices).toBe(layout.notices);
		expect(tables.notices).toHaveBeenCalledOnce();
	});

	it("cleans up every collection on sign-out and starts the next session empty", async () => {
		const tables = fakeTables();
		const registry = createCollectionRegistry(tables);
		const before = await registry.use("notices", "meetings");

		await registry.endSession();

		expect(before.notices.cleanup).toHaveBeenCalledOnce();
		expect(before.meetings.cleanup).toHaveBeenCalledOnce();

		// Nothing the last User loaded reaches the next one: asking again builds afresh.
		const after = await registry.use("notices");
		expect(after.notices).not.toBe(before.notices);
		expect(after.notices.cleanup).not.toHaveBeenCalled();
		expect(tables.notices).toHaveBeenCalledTimes(2);
	});

	it("cleans up a collection that was still being built at sign-out", async () => {
		const tables = fakeTables();
		const registry = createCollectionRegistry(tables);
		const pending = registry.use("notices");

		await registry.endSession();

		const { notices } = await pending;
		expect(notices.cleanup).toHaveBeenCalledOnce();
	});

	it("leaves nothing to clean up when nothing was asked for", async () => {
		const tables = fakeTables();
		const registry = createCollectionRegistry(tables);

		await registry.endSession();

		expect(tables.notices).not.toHaveBeenCalled();
		expect(tables.meetings).not.toHaveBeenCalled();
	});

	it("tries a table again after its build fails", async () => {
		// A chunk that failed to download must not break that table for the rest of the session.
		const tables = fakeTables();
		tables.notices.mockRejectedValueOnce(new Error("chunk failed to load"));
		const registry = createCollectionRegistry(tables);

		await expect(registry.use("notices")).rejects.toThrow(
			"chunk failed to load",
		);
		const { notices } = await registry.use("notices");

		expect(notices.table).toBe("notices");
	});
});
