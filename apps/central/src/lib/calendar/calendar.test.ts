/**
 * Ordering, the day arithmetic the month grid stands on, `packWeek` and the three filters.
 * The mappers have their own file.
 */
import { describe, expect, it } from "vitest";
import {
	addDays,
	daysBetween,
	lastDayOf,
	monthWeeks,
	shiftMonth,
	weekdayOf,
} from "./days";
import {
	holidaysInYear,
	itemsBetween,
	monthItems,
	upcomingItems,
} from "./filters";
import { type CalendarItem, sortItems } from "./items";
import { packWeek } from "./pack-week";

let seq = 0;
function item(
	fields: Partial<CalendarItem> & { startsOn: string },
): CalendarItem {
	seq++;
	return {
		endsOn: fields.startsOn,
		key: `k${seq}`,
		source: "staffEvent",
		status: "normal",
		title: `Item ${seq}`,
		...fields,
	};
}

describe("sortItems", () => {
	it("orders by day, then whole-day first, then time, then title", () => {
		const items = [
			item({ startsOn: "2026-10-22", title: "Next day" }),
			item({ startTime: "19:00", startsOn: "2026-10-21", title: "Evening" }),
			item({ startTime: "09:00", startsOn: "2026-10-21", title: "Morning B" }),
			item({ startTime: "09:00", startsOn: "2026-10-21", title: "Morning A" }),
			item({ source: "holiday", startsOn: "2026-10-21", title: "Whole day" }),
		];

		expect(sortItems(items).map((i) => i.title)).toEqual([
			"Whole day",
			"Morning A",
			"Morning B",
			"Evening",
			"Next day",
		]);
	});

	it("does not reorder what it was given", () => {
		const items = [
			item({ startsOn: "2026-10-22" }),
			item({ startsOn: "2026-10-21" }),
		];
		const first = items[0];
		sortItems(items);
		expect(items[0]).toBe(first);
	});
});

describe("day arithmetic", () => {
	it("adds days across months, years and both DST changes", () => {
		expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
		expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
		expect(addDays("2026-03-07", 2)).toBe("2026-03-09");
		expect(addDays("2026-11-01", 1)).toBe("2026-11-02");
		expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
	});

	it("counts the days between two days", () => {
		expect(daysBetween("2026-03-07", "2026-03-09")).toBe(2);
		expect(daysBetween("2026-10-22", "2026-10-21")).toBe(-1);
	});

	it("names the weekday, Sunday as 0", () => {
		expect(weekdayOf("2026-10-11")).toBe(0);
		expect(weekdayOf("2026-10-17")).toBe(6);
	});

	it("steps months across a year", () => {
		expect(shiftMonth("2026-12", 1)).toBe("2027-01");
		expect(shiftMonth("2026-01", -1)).toBe("2025-12");
		expect(lastDayOf("2028-02")).toBe("2028-02-29");
	});

	it("covers a month with whole Sunday-to-Saturday weeks", () => {
		const weeks = monthWeeks("2026-10");
		expect(weeks).toHaveLength(5);
		expect(weeks[0]?.[0]).toBe("2026-09-27");
		expect(weeks[0]?.[4]).toBe("2026-10-01");
		expect(weeks[4]?.[6]).toBe("2026-10-31");
		expect(weeks.every((week) => week.length === 7)).toBe(true);
	});

	it("gives a month that starts on Sunday no leading days", () => {
		expect(monthWeeks("2026-11")[0]?.[0]).toBe("2026-11-01");
	});
});

describe("packWeek", () => {
	const week = monthWeeks("2026-10")[3] as string[]; // Sun Oct 18 – Sat Oct 24

	it("places a single day in its column, spanning one", () => {
		const [segment] = packWeek(week, [item({ startsOn: "2026-10-21" })]);
		expect(segment).toMatchObject({
			col: 3,
			continuesAfter: false,
			continuesBefore: false,
			lane: 0,
			span: 1,
		});
	});

	it("cuts a span that crosses the week and flags both edges", () => {
		const [segment] = packWeek(week, [
			item({ endsOn: "2026-10-27", startsOn: "2026-10-15" }),
		]);
		expect(segment).toMatchObject({
			col: 0,
			continuesAfter: true,
			continuesBefore: true,
			span: 7,
		});
	});

	it("flags only the edge an item actually crosses", () => {
		const [segment] = packWeek(week, [
			item({ endsOn: "2026-10-26", startsOn: "2026-10-23" }),
		]);
		expect(segment).toMatchObject({
			col: 5,
			continuesAfter: true,
			continuesBefore: false,
			span: 2,
		});
	});

	it("stacks overlapping items into lanes and reuses a lane once it is free", () => {
		const long = item({
			endsOn: "2026-10-21",
			startsOn: "2026-10-19",
			title: "Long",
		});
		const sameDay = item({ startsOn: "2026-10-19", title: "Same day" });
		const inside = item({ startsOn: "2026-10-20", title: "Inside" });
		const after = item({ startsOn: "2026-10-22", title: "After" });

		const lanes = Object.fromEntries(
			packWeek(week, [sameDay, inside, after, long]).map((s) => [
				s.item.title,
				s.lane,
			]),
		);

		// The longer item on the shared first day takes the top lane.
		expect(lanes).toEqual({ After: 0, Inside: 1, Long: 0, "Same day": 1 });
	});

	it("leaves out items outside the week", () => {
		expect(
			packWeek(week, [
				item({ startsOn: "2026-10-17" }),
				item({ startsOn: "2026-10-25" }),
			]),
		).toEqual([]);
	});
});

describe("the filters", () => {
	describe("itemsBetween and monthItems", () => {
		const items = sortItems([
			item({ startsOn: "2026-09-30", title: "Before" }),
			item({ endsOn: "2026-10-02", startsOn: "2026-09-29", title: "Into" }),
			item({ startsOn: "2026-10-15", title: "In" }),
			item({ endsOn: "2026-11-03", startsOn: "2026-10-31", title: "Out of" }),
			item({ startsOn: "2026-11-01", title: "After" }),
		]);

		it("keeps items touching the month, including ones crossing its edges", () => {
			expect(monthItems(items, "2026-10").map((i) => i.title)).toEqual([
				"Into",
				"In",
				"Out of",
			]);
		});

		it("is inclusive at both ends", () => {
			expect(
				itemsBetween(items, "2026-10-15", "2026-10-15").map((i) => i.title),
			).toEqual(["In"]);
		});
	});

	describe("upcomingItems", () => {
		const today = "2026-10-21";

		it("keeps what has not ended, including what is under way and what was cancelled", () => {
			const items = sortItems([
				item({ startsOn: "2026-10-20", title: "Yesterday" }),
				item({
					endsOn: "2026-10-22",
					startsOn: "2026-10-19",
					title: "Under way",
				}),
				item({ startsOn: "2026-10-21", title: "Today" }),
				item({
					startsOn: "2026-10-23",
					status: "cancelled",
					title: "Called off",
				}),
			]);

			expect(upcomingItems(items, today).map((i) => i.title)).toEqual([
				"Under way",
				"Today",
				"Called off",
			]);
		});

		it("drops Completed Spray Missions and a Delayed original that has a rain date", () => {
			const mission = { source: "sprayMission" as const };
			const items = sortItems([
				item({
					...mission,
					startsOn: "2026-10-21",
					status: "completed",
					title: "Done",
				}),
				item({
					...mission,
					otherDate: "2026-10-23",
					startsOn: "2026-10-22",
					status: "delayed",
					title: "Moved",
				}),
				item({
					...mission,
					otherDate: "2026-10-22",
					startsOn: "2026-10-23",
					status: "rainDate",
					title: "Rain date",
				}),
				item({
					...mission,
					startsOn: "2026-10-24",
					status: "delayed",
					title: "Put off",
				}),
			]);

			expect(upcomingItems(items, today).map((i) => i.title)).toEqual([
				"Rain date",
				"Put off",
			]);
		});

		it("returns the first five by default, however far off", () => {
			const items = sortItems(
				Array.from({ length: 7 }, (_, i) =>
					item({ startsOn: addDays(today, i * 60), title: `#${i}` }),
				),
			);

			expect(upcomingItems(items, today).map((i) => i.title)).toEqual([
				"#0",
				"#1",
				"#2",
				"#3",
				"#4",
			]);
		});
	});

	describe("holidaysInYear", () => {
		it("keeps the Holidays observed in the year, by the day they are observed", () => {
			const items = sortItems([
				item({ source: "holiday", startsOn: "2026-12-25", title: "Christmas" }),
				// New Year's Day 2028 is a Saturday, observed Friday 31 December: it is 2027's.
				item({
					source: "holiday",
					startsOn: "2027-12-31",
					title: "New Year's Day",
				}),
				item({ startsOn: "2027-03-01", title: "A Staff Event" }),
				item({
					source: "holiday",
					startsOn: "2027-01-01",
					title: "New Year's",
				}),
			]);

			expect(holidaysInYear(items, 2027).map((i) => i.title)).toEqual([
				"New Year's",
				"New Year's Day",
			]);
		});
	});
});
