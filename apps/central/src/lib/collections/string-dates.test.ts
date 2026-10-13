/**
 * A table whose `date` columns are days keeps them as text on BOTH write paths (#298): the row
 * Electric streams in and the optimistic row a form inserts must agree, or a screen comparing
 * `observed_on` to "today" would see a Date on one row and a string on the next.
 *
 * The sync half runs for real: `fetch` answers the shape request with an Electric response
 * carrying the column types in its `electric-schema` header, which is what the parser keys on.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { createCentralCollections } from ".";

afterEach(() => {
	vi.unstubAllGlobals();
});

const SYNCED_ID = "11111111-1111-4111-8111-111111111111";
const OPTIMISTIC_ID = "22222222-2222-4222-8222-222222222222";

function shapeResponse(): Response {
	const value = {
		created_at: "2026-01-02 15:04:05+00",
		falls_on: "2026-07-04",
		id: SYNCED_ID,
		name: "Independence Day",
		observed_on: "2026-07-03",
		updated_at: "2026-01-02 15:04:05+00",
	};
	return new Response(
		JSON.stringify([
			{
				headers: { operation: "insert" },
				key: `"public"."holidays"/"${SYNCED_ID}"`,
				value,
			},
			{ headers: { control: "up-to-date" } },
		]),
		{
			headers: {
				"content-type": "application/json",
				"electric-cursor": "1",
				"electric-handle": "holidays-handle",
				"electric-offset": "0_0",
				"electric-schema": JSON.stringify({
					created_at: { type: "timestamptz" },
					falls_on: { type: "date" },
					id: { type: "uuid" },
					name: { type: "text" },
					observed_on: { type: "date" },
					updated_at: { type: "timestamptz" },
				}),
				"electric-up-to-date": "",
			},
			status: 200,
		},
	);
}

describe("holidays' dates", () => {
	it("sync as the same YYYY-MM-DD text an optimistic row holds", async () => {
		// Every request after the first is a live poll; leave it pending so nothing loops.
		const fetch = vi
			.fn()
			.mockResolvedValueOnce(shapeResponse())
			.mockImplementation(() => new Promise<Response>(() => {}));
		vi.stubGlobal("fetch", fetch);
		const collections = createCentralCollections("https://api.test");
		const { holidays } = await collections.use("holidays");

		await holidays.preload();
		const now = new Date();
		holidays.insert(
			{
				created_at: now,
				falls_on: "2026-07-04",
				id: OPTIMISTIC_ID,
				name: "Independence Day (draft)",
				observed_on: "2026-07-03",
				updated_at: now,
			},
			// Never sent: the mutation is only here to be read back optimistically.
			{ optimistic: true },
		);

		const synced = holidays.get(SYNCED_ID);
		const optimistic = holidays.get(OPTIMISTIC_ID);
		expect(synced?.observed_on).toBe("2026-07-03");
		expect(synced?.falls_on).toBe("2026-07-04");
		expect(optimistic?.observed_on).toBe(synced?.observed_on);
		expect(optimistic?.falls_on).toBe(synced?.falls_on);
		// The parser override is per table: timestamps still arrive as Dates.
		expect(synced?.created_at).toBeInstanceOf(Date);

		await collections.endSession();
	});
});
