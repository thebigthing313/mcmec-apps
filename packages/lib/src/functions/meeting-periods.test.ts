import { describe, expect, it } from "vitest";
import {
	defaultMeetingPeriod,
	emptyMeetingPeriodLabel,
	keepMeetingPeriod,
	meetingPeriodCountLabel,
	meetingPeriodLabel,
	meetingPeriods,
} from "./meeting-periods";

type Row = { id: string; at: Date };

const at = (row: Row) => row.at;
const now = new Date("2026-01-15T12:00:00Z");

const rows: Row[] = [
	{ at: new Date("2027-01-10T12:00:00Z"), id: "next-year" },
	{ at: new Date("2026-02-10T12:00:00Z"), id: "upcoming" },
	{ at: new Date("2026-01-05T12:00:00Z"), id: "this-year-past" },
	{ at: new Date("2024-06-01T12:00:00Z"), id: "old" },
];

describe("meetingPeriods", () => {
	it("offers Upcoming first, then every calendar year present, newest first", () => {
		expect(meetingPeriods(rows, at, now)).toEqual([
			"upcoming",
			2027,
			2026,
			2024,
		]);
	});

	it("omits Upcoming when nothing is still to come", () => {
		const past: Row[] = [
			{ at: new Date("2025-06-01T12:00:00Z"), id: "a" },
			{ at: new Date("2024-06-01T12:00:00Z"), id: "b" },
		];

		expect(meetingPeriods(past, at, now)).toEqual([2025, 2024]);
	});

	it("has no options at all for no meetings", () => {
		expect(meetingPeriods([], at, now)).toEqual([]);
	});
});

describe("defaultMeetingPeriod", () => {
	it("starts on Upcoming when there is one", () => {
		expect(defaultMeetingPeriod(meetingPeriods(rows, at, now))).toBe(
			"upcoming",
		);
	});

	it("falls back to the most recent year present, not the wall-clock year", () => {
		const past: Row[] = [{ at: new Date("2024-06-01T12:00:00Z"), id: "a" }];

		expect(defaultMeetingPeriod(meetingPeriods(past, at, now))).toBe(2024);
	});

	it("is null when there is nothing to show", () => {
		expect(defaultMeetingPeriod([])).toBeNull();
	});
});

describe("keepMeetingPeriod", () => {
	it("keeps everything at or after now for Upcoming", () => {
		expect(
			keepMeetingPeriod(rows, at, "upcoming", now).map((row) => row.id),
		).toEqual(["next-year", "upcoming"]);
	});

	it("keeps a calendar year whole, upcoming meetings in it included", () => {
		expect(keepMeetingPeriod(rows, at, 2026, now).map((row) => row.id)).toEqual(
			["upcoming", "this-year-past"],
		);
	});

	it("counts a meeting starting exactly now as upcoming", () => {
		const boundary: Row[] = [{ at: new Date(now), id: "starting" }];

		expect(
			keepMeetingPeriod(boundary, at, "upcoming", now).map((row) => row.id),
		).toEqual(["starting"]);
	});

	it("keeps nothing for a null period", () => {
		expect(keepMeetingPeriod(rows, at, null, now)).toEqual([]);
	});
});

describe("labels", () => {
	it("names the periods", () => {
		expect(meetingPeriodLabel("upcoming")).toBe("Upcoming");
		expect(meetingPeriodLabel(2025)).toBe("2025");
	});

	it("counts them in the reader's words", () => {
		expect(meetingPeriodCountLabel(2, "upcoming")).toBe("2 upcoming meetings");
		expect(meetingPeriodCountLabel(1, "upcoming")).toBe("1 upcoming meeting");
		expect(meetingPeriodCountLabel(3, 2025)).toBe("3 meetings in 2025");
		expect(meetingPeriodCountLabel(0, null)).toBe("0 meetings");
	});

	it("says what is empty", () => {
		expect(emptyMeetingPeriodLabel("upcoming")).toBe(
			"No upcoming meetings scheduled.",
		);
		expect(emptyMeetingPeriodLabel(2025)).toBe("No meetings found for 2025.");
		expect(emptyMeetingPeriodLabel(null)).toBe("No meetings found.");
	});
});
