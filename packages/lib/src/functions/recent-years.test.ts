import { describe, expect, it } from "vitest";
import {
	keepRecentYears,
	keepUpcomingAndRecentYears,
	RECENT_YEARS_SHOWN,
} from "./recent-years";

type Row = { id: string; year: number };

const year = (row: Row) => row.year;

describe("keepRecentYears", () => {
	it("keeps only the three most recent years present", () => {
		const rows: Row[] = [
			{ id: "a", year: 2026 },
			{ id: "b", year: 2025 },
			{ id: "c", year: 2024 },
			{ id: "d", year: 2023 },
			{ id: "e", year: 2022 },
		];

		expect(keepRecentYears(rows, year).map((row) => row.id)).toEqual([
			"a",
			"b",
			"c",
		]);
	});

	it("counts distinct years, not rows", () => {
		const rows: Row[] = [
			{ id: "a", year: 2026 },
			{ id: "b", year: 2026 },
			{ id: "c", year: 2025 },
			{ id: "d", year: 2024 },
			{ id: "e", year: 2023 },
		];

		expect(keepRecentYears(rows, year).map((row) => row.id)).toEqual([
			"a",
			"b",
			"c",
			"d",
		]);
	});

	it("skips gaps rather than counting them", () => {
		const rows: Row[] = [
			{ id: "a", year: 2025 },
			{ id: "b", year: 2023 },
			{ id: "c", year: 2021 },
			{ id: "d", year: 2019 },
		];

		expect(keepRecentYears(rows, year).map((row) => row.id)).toEqual([
			"a",
			"b",
			"c",
		]);
	});

	it("returns everything when fewer years are present than the window", () => {
		const rows: Row[] = [
			{ id: "a", year: 2025 },
			{ id: "b", year: 2024 },
		];

		expect(keepRecentYears(rows, year).map((row) => row.id)).toEqual([
			"a",
			"b",
		]);
	});

	it("returns an empty list for an empty input", () => {
		expect(keepRecentYears([], year)).toEqual([]);
	});

	it("preserves the caller's ordering", () => {
		const rows: Row[] = [
			{ id: "a", year: 2024 },
			{ id: "b", year: 2026 },
			{ id: "c", year: 2020 },
			{ id: "d", year: 2025 },
		];

		expect(keepRecentYears(rows, year).map((row) => row.id)).toEqual([
			"a",
			"b",
			"d",
		]);
	});

	it("accepts an explicit window size", () => {
		const rows: Row[] = [
			{ id: "a", year: 2026 },
			{ id: "b", year: 2025 },
			{ id: "c", year: 2024 },
		];

		expect(keepRecentYears(rows, year, 1).map((row) => row.id)).toEqual(["a"]);
	});

	it("shows three years by default", () => {
		expect(RECENT_YEARS_SHOWN).toBe(3);
	});
});

type Dated = { id: string; at: Date };

const at = (row: Dated) => row.at;
const now = new Date("2026-06-15T12:00:00.000Z");

describe("keepUpcomingAndRecentYears", () => {
	it("keeps every item at or after now, however far ahead", () => {
		const rows: Dated[] = [
			{ at: new Date("2031-02-01T00:00:00.000Z"), id: "far-future" },
			{ at: now, id: "now" },
			{ at: new Date("2026-06-15T11:59:59.000Z"), id: "a-moment-ago" },
		];

		expect(
			keepUpcomingAndRecentYears(rows, at, now).map((row) => row.id),
		).toEqual(["far-future", "now", "a-moment-ago"]);
	});

	it("limits past items to the three most recent years that have one", () => {
		const rows: Dated[] = [
			{ at: new Date("2026-01-10T00:00:00.000Z"), id: "2026" },
			{ at: new Date("2025-01-10T00:00:00.000Z"), id: "2025" },
			{ at: new Date("2024-01-10T00:00:00.000Z"), id: "2024" },
			{ at: new Date("2023-01-10T00:00:00.000Z"), id: "2023" },
		];

		expect(
			keepUpcomingAndRecentYears(rows, at, now).map((row) => row.id),
		).toEqual(["2026", "2025", "2024"]);
	});

	it("does not spend the past window on upcoming years", () => {
		const rows: Dated[] = [
			{ at: new Date("2028-01-10T00:00:00.000Z"), id: "upcoming-2028" },
			{ at: new Date("2027-01-10T00:00:00.000Z"), id: "upcoming-2027" },
			{ at: new Date("2026-12-10T00:00:00.000Z"), id: "upcoming-2026" },
			{ at: new Date("2026-01-10T00:00:00.000Z"), id: "past-2026" },
			{ at: new Date("2025-01-10T00:00:00.000Z"), id: "past-2025" },
			{ at: new Date("2024-01-10T00:00:00.000Z"), id: "past-2024" },
			{ at: new Date("2023-01-10T00:00:00.000Z"), id: "past-2023" },
		];

		expect(
			keepUpcomingAndRecentYears(rows, at, now).map((row) => row.id),
		).toEqual([
			"upcoming-2028",
			"upcoming-2027",
			"upcoming-2026",
			"past-2026",
			"past-2025",
			"past-2024",
		]);
	});

	it("skips years with no past item", () => {
		const rows: Dated[] = [
			{ at: new Date("2025-03-01T00:00:00.000Z"), id: "2025" },
			{ at: new Date("2022-03-01T00:00:00.000Z"), id: "2022" },
			{ at: new Date("2019-03-01T00:00:00.000Z"), id: "2019" },
			{ at: new Date("2016-03-01T00:00:00.000Z"), id: "2016" },
		];

		expect(
			keepUpcomingAndRecentYears(rows, at, now).map((row) => row.id),
		).toEqual(["2025", "2022", "2019"]);
	});

	it("keeps a past item that lacks any related record of its own", () => {
		const rows: (Dated & { minutesUrl: string | null })[] = [
			{
				at: new Date("2026-05-01T00:00:00.000Z"),
				id: "no-minutes",
				minutesUrl: null,
			},
		];

		expect(
			keepUpcomingAndRecentYears(rows, at, now).map((row) => row.id),
		).toEqual(["no-minutes"]);
	});
});
