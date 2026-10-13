/**
 * A table whose `date` columns are days keeps them as text on BOTH write paths (#298): the row
 * Electric streams in and the optimistic row a form inserts must agree, or a screen comparing
 * `starts_on` to "today" would see a Date on one row and a string on the next.
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
const STAMP = "2026-01-02 15:04:05+00";

function shapeResponse(
	table: string,
	value: Record<string, unknown>,
	types: Record<string, string>,
): Response {
	return new Response(
		JSON.stringify([
			{
				headers: { operation: "insert" },
				key: `"public"."${table}"/"${SYNCED_ID}"`,
				value: {
					...value,
					created_at: STAMP,
					id: SYNCED_ID,
					updated_at: STAMP,
				},
			},
			{ headers: { control: "up-to-date" } },
		]),
		{
			headers: {
				"content-type": "application/json",
				"electric-cursor": "1",
				"electric-handle": `${table}-handle`,
				"electric-offset": "0_0",
				"electric-schema": JSON.stringify(
					Object.fromEntries(
						Object.entries({
							...types,
							created_at: "timestamptz",
							id: "uuid",
							updated_at: "timestamptz",
						}).map(([column, type]) => [column, { type }]),
					),
				),
				"electric-up-to-date": "",
			},
			status: 200,
		},
	);
}

const CASES = [
	{
		dates: ["observed_on", "falls_on"],
		row: {
			falls_on: "2026-07-04",
			name: "Independence Day",
			observed_on: "2026-07-03",
		},
		table: "holidays",
		types: {
			falls_on: "date",
			name: "text",
			observed_on: "date",
		},
	},
	{
		dates: ["starts_on", "ends_on"],
		row: {
			description: null,
			end_time: "15:00:00",
			ends_on: "2026-10-23",
			is_cancelled: false,
			location: null,
			start_time: "13:00:00",
			starts_on: "2026-10-21",
			title: "Recertification",
			url: null,
		},
		table: "staffEvents",
		types: {
			description: "text",
			end_time: "time",
			ends_on: "date",
			is_cancelled: "bool",
			location: "text",
			start_time: "time",
			starts_on: "date",
			title: "text",
			url: "text",
		},
	},
] as const;

const SHAPE_NAME = { holidays: "holidays", staffEvents: "staff_events" };

describe.each(CASES)("$table", ({ table, row, types, dates }) => {
	it("syncs its dates as the same YYYY-MM-DD text an optimistic row holds", async () => {
		// Every request after the first is a live poll; leave it pending so nothing loops.
		const fetch = vi
			.fn()
			.mockResolvedValueOnce(shapeResponse(SHAPE_NAME[table], row, types))
			.mockImplementation(() => new Promise<Response>(() => {}));
		vi.stubGlobal("fetch", fetch);
		const collections = createCentralCollections("https://api.test");
		const collection = (await collections.use(table))[table];

		await collection.preload();
		const now = new Date();
		// Never settles: the command request is left pending, so the row stays optimistic.
		// biome-ignore lint/suspicious/noExplicitAny: one insert, either table's row shape
		(collection as any).insert(
			{ ...row, created_at: now, id: OPTIMISTIC_ID, updated_at: now },
			{ metadata: { intents: ["test"] } },
		);

		const synced = collection.get(SYNCED_ID) as unknown as Record<
			string,
			unknown
		>;
		const optimistic = collection.get(OPTIMISTIC_ID) as unknown as Record<
			string,
			unknown
		>;
		for (const column of dates) {
			expect(synced[column]).toBe(row[column as keyof typeof row]);
			expect(optimistic[column]).toBe(synced[column]);
		}
		// The parser override is per table: timestamps still arrive as Dates.
		expect(synced.created_at).toBeInstanceOf(Date);

		await collections.endSession();
	});
});
