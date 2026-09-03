import { describe, expect, it } from "vitest";
import {
	emptySprayPeriodLabel,
	missionEndsAt,
	partitionSprayMissions,
	type SprayMissionTimes,
	sprayPeriodCountLabel,
	sprayPeriodLabel,
	sprayPeriodOf,
} from "./spray-periods";

// Local, not UTC: the implementation places missions on the reader's own clock, and a
// UTC literal would put these tests in a different day than the code under test.
const day = (year: number, month: number, date: number) =>
	new Date(year, month - 1, date);

const mission = (
	date: Date,
	startTime: string,
	endTime: string,
): SprayMissionTimes => ({ endTime, missionDate: date, startTime });

describe("missionEndsAt", () => {
	it("ends on the mission's own day for an evening mission", () => {
		expect(
			missionEndsAt(mission(day(2026, 9, 3), "19:00:00", "23:00:00")),
		).toEqual(new Date(2026, 8, 3, 23, 0, 0, 0));
	});

	it("rolls into the next day when the mission crosses midnight", () => {
		expect(
			missionEndsAt(mission(day(2026, 9, 3), "21:00:00", "02:00:00")),
		).toEqual(new Date(2026, 8, 4, 2, 0, 0, 0));
	});

	it("treats an end of midnight as the close of the starting day", () => {
		expect(
			missionEndsAt(mission(day(2026, 9, 3), "19:00:00", "00:00:00")),
		).toEqual(new Date(2026, 8, 4, 0, 0, 0, 0));
	});

	it("keeps an early-morning mission on its own date", () => {
		// 3am-8am is dated the 4th even though a resident calls it the night of the 3rd.
		expect(
			missionEndsAt(mission(day(2026, 9, 4), "03:00:00", "08:00:00")),
		).toEqual(new Date(2026, 8, 4, 8, 0, 0, 0));
	});

	it("accepts HH:MM without seconds", () => {
		expect(missionEndsAt(mission(day(2026, 9, 3), "19:00", "23:30"))).toEqual(
			new Date(2026, 8, 3, 23, 30, 0, 0),
		);
	});

	it("falls back to the end of the day rather than throwing on a malformed time", () => {
		expect(missionEndsAt(mission(day(2026, 9, 3), "19:00", ""))).toEqual(
			new Date(2026, 8, 3, 23, 59, 59, 999),
		);
	});
});

describe("sprayPeriodOf", () => {
	it("keeps a mission upcoming while it is still running", () => {
		const inProgress = mission(day(2026, 9, 3), "19:00:00", "23:00:00");
		expect(sprayPeriodOf(inProgress, new Date(2026, 8, 3, 21, 0))).toBe(
			"upcoming",
		);
	});

	it("keeps an overnight mission upcoming after midnight", () => {
		// The defect this guards: a 9pm-2am mission dropping into Past at 00:00 with
		// trucks still out.
		const overnight = mission(day(2026, 9, 3), "21:00:00", "02:00:00");
		expect(sprayPeriodOf(overnight, new Date(2026, 8, 4, 1, 0))).toBe(
			"upcoming",
		);
	});

	it("moves a mission to past once it has ended", () => {
		const overnight = mission(day(2026, 9, 3), "21:00:00", "02:00:00");
		expect(sprayPeriodOf(overnight, new Date(2026, 8, 4, 3, 0))).toBe("past");
	});

	it("counts a mission later today as upcoming", () => {
		const tonight = mission(day(2026, 9, 3), "19:00:00", "23:00:00");
		expect(sprayPeriodOf(tonight, new Date(2026, 8, 3, 9, 0))).toBe("upcoming");
	});
});

describe("partitionSprayMissions", () => {
	type Row = { id: string; times: SprayMissionTimes };
	const times = (row: Row) => row.times;

	const rows: Row[] = [
		{ id: "next-week", times: mission(day(2026, 9, 10), "19:00", "23:00") },
		{ id: "last-month", times: mission(day(2026, 8, 12), "19:00", "23:00") },
		{ id: "tomorrow", times: mission(day(2026, 9, 4), "19:00", "23:00") },
		{ id: "yesterday", times: mission(day(2026, 9, 2), "19:00", "23:00") },
	];

	const now = new Date(2026, 8, 3, 12, 0);

	it("orders upcoming soonest first", () => {
		expect(
			partitionSprayMissions(rows, times, now).upcoming.map((r) => r.id),
		).toEqual(["tomorrow", "next-week"]);
	});

	it("orders past most recent first", () => {
		expect(
			partitionSprayMissions(rows, times, now).past.map((r) => r.id),
		).toEqual(["yesterday", "last-month"]);
	});

	it("breaks ties on one date by start time", () => {
		const sameDay: Row[] = [
			{ id: "late", times: mission(day(2026, 9, 4), "21:00", "23:00") },
			{ id: "early", times: mission(day(2026, 9, 4), "03:00", "08:00") },
		];
		expect(
			partitionSprayMissions(sameDay, times, now).upcoming.map((r) => r.id),
		).toEqual(["early", "late"]);
	});

	it("does not consult status — a past mission still badged scheduled stays past", () => {
		// Staff advance status by hand (ADR 0001), so the lag is expected and must not
		// change where a mission sits.
		const stale: Row[] = [
			{
				id: "awaiting-update",
				times: mission(day(2026, 9, 1), "19:00", "23:00"),
			},
		];
		const { upcoming, past } = partitionSprayMissions(stale, times, now);
		expect(upcoming).toEqual([]);
		expect(past.map((r) => r.id)).toEqual(["awaiting-update"]);
	});

	it("returns two empty groups for no missions", () => {
		expect(partitionSprayMissions([], times, now)).toEqual({
			past: [],
			upcoming: [],
		});
	});
});

describe("labels", () => {
	it("names each group", () => {
		expect(sprayPeriodLabel("upcoming")).toBe("Upcoming spray missions");
		expect(sprayPeriodLabel("past")).toBe("Past spray missions");
	});

	it("singularises a count of one", () => {
		expect(sprayPeriodCountLabel(1, "upcoming")).toBe("1 upcoming mission");
		expect(sprayPeriodCountLabel(2, "upcoming")).toBe("2 upcoming missions");
		expect(sprayPeriodCountLabel(0, "past")).toBe("0 past missions");
	});

	it("offers reassurance when nothing is coming", () => {
		expect(emptySprayPeriodLabel("upcoming")).toBe(
			"No upcoming spray missions scheduled.",
		);
	});
});
