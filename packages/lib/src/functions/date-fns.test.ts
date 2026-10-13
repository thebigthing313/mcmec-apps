import { describe, expect, it } from "vitest";
import {
	COMMISSION_TIME_ZONE,
	commissionToday,
	formatClockTime,
	formatDate,
	formatDateShort,
	formatDateShortWithWeekday,
	formatDateTime,
	formatDateWithWeekday,
	toCommissionLocal,
	yearOf,
} from "./date-fns";

/**
 * These assertions are deliberately absolute rather than computed from the host clock.
 *
 * The defect they guard is precisely that the output used to depend on the runtime's own
 * timezone: the SSR server renders in UTC and the browser renders in the reader's zone, so a
 * meeting time disagreed with itself across hydration. A test that derived its expectation
 * the same way the code does would have passed throughout.
 */
describe("formatDateTime", () => {
	it("renders a winter meeting in Eastern Standard Time", () => {
		// 17:00Z in January is noon in Edison.
		expect(formatDateTime(new Date("2026-01-22T17:00:00Z"))).toBe(
			"Thursday, January 22, 2026 12:00 PM (EST)",
		);
	});

	it("renders a summer meeting in Eastern Daylight Time", () => {
		// 16:00Z in July is noon in Edison — one hour's offset difference from the above.
		expect(formatDateTime(new Date("2026-07-22T16:00:00Z"))).toBe(
			"Wednesday, July 22, 2026 12:00 PM (EDT)",
		);
	});

	it("does not roll an evening meeting into the following day", () => {
		// 00:30Z on the 15th is 8:30pm on the 14th in Edison. Unpinned, this rendered as
		// the 15th on the server and the 14th in the browser.
		expect(formatDateTime(new Date("2026-05-15T00:30:00Z"))).toBe(
			"Thursday, May 14, 2026 8:30 PM (EDT)",
		);
	});

	it("accepts a string as readily as a Date", () => {
		expect(formatDateTime("2026-01-22T17:00:00Z")).toBe(
			"Thursday, January 22, 2026 12:00 PM (EST)",
		);
	});

	it("returns an empty string for nothing, rather than 'Invalid Date'", () => {
		expect(formatDateTime(null)).toBe("");
		expect(formatDateTime(undefined)).toBe("");
		expect(formatDateTime("not a date")).toBe("");
	});

	it("names the Commission's zone", () => {
		expect(COMMISSION_TIME_ZONE).toBe("America/New_York");
	});
});

describe("formatDate", () => {
	it("keeps a date-only value on its own day", () => {
		// Pinned to UTC on purpose: a `date` column carries no instant, and reading it in a
		// western zone would show the previous day.
		expect(formatDate(new Date("2026-01-15T00:00:00Z"))).toBe(
			"January 15, 2026",
		);
	});

	it("returns an empty string for nothing", () => {
		expect(formatDate(null)).toBe("");
		expect(formatDate("not a date")).toBe("");
	});
});

describe("formatDateShort", () => {
	it("keeps a date-only value on its own day", () => {
		expect(formatDateShort(new Date("2026-01-15T00:00:00Z"))).toBe("1/15/2026");
	});

	it("returns an empty string for nothing", () => {
		expect(formatDateShort(null)).toBe("");
	});
});

describe("formatDateWithWeekday", () => {
	it("names the weekday of a date-only value", () => {
		expect(formatDateWithWeekday(new Date("2026-09-04"))).toBe(
			"Friday, September 04, 2026",
		);
	});

	it("keeps the weekday on the mission's own day, not the reader's", () => {
		// UTC midnight read in New Jersey is 8pm the previous evening — a Thursday. Pinned to
		// UTC, the mission stays Friday wherever the page renders.
		expect(formatDateWithWeekday("2026-09-04")).toBe(
			"Friday, September 04, 2026",
		);
	});

	it("returns an empty string for nothing", () => {
		expect(formatDateWithWeekday(null)).toBe("");
		expect(formatDateWithWeekday(undefined)).toBe("");
		expect(formatDateWithWeekday("not a date")).toBe("");
	});
});

describe("formatDateShortWithWeekday", () => {
	it("abbreviates the weekday and the month", () => {
		expect(formatDateShortWithWeekday(new Date("2026-09-04"))).toBe(
			"Fri, Sep 4, 2026",
		);
	});

	it("returns an empty string for nothing", () => {
		expect(formatDateShortWithWeekday(null)).toBe("");
		expect(formatDateShortWithWeekday("not a date")).toBe("");
	});
});

describe("formatClockTime", () => {
	it("renders an evening shift as a wall clock", () => {
		expect(formatClockTime("19:00:00")).toBe("7:00 PM");
	});

	it("renders an early-morning shift as AM", () => {
		expect(formatClockTime("03:30")).toBe("3:30 AM");
	});

	it("calls midnight 12 AM and noon 12 PM", () => {
		expect(formatClockTime("00:00:00")).toBe("12:00 AM");
		expect(formatClockTime("12:00:00")).toBe("12:00 PM");
	});

	it("returns an empty string for nothing", () => {
		expect(formatClockTime(null)).toBe("");
		expect(formatClockTime("")).toBe("");
	});

	it("hands back an unparseable value rather than NaN", () => {
		expect(formatClockTime("whenever")).toBe("whenever");
	});
});

describe("toCommissionLocal", () => {
	it("reads a winter instant in Eastern Standard Time", () => {
		expect(toCommissionLocal(new Date("2026-01-22T17:00:00Z"))).toEqual({
			date: "2026-01-22",
			time: "12:00",
		});
	});

	it("reads a summer instant in Eastern Daylight Time", () => {
		expect(toCommissionLocal(new Date("2026-07-22T16:00:00Z"))).toEqual({
			date: "2026-07-22",
			time: "12:00",
		});
	});

	// 2026-03-08: clocks jump from 02:00 EST to 03:00 EDT at 07:00Z.
	it("crosses the spring change without losing the day", () => {
		expect(toCommissionLocal(new Date("2026-03-08T06:59:00Z"))).toEqual({
			date: "2026-03-08",
			time: "01:59",
		});
		expect(toCommissionLocal(new Date("2026-03-08T07:00:00Z"))).toEqual({
			date: "2026-03-08",
			time: "03:00",
		});
	});

	// 2026-11-01: clocks fall back from 02:00 EDT to 01:00 EST at 06:00Z.
	it("crosses the autumn change without losing the day", () => {
		expect(toCommissionLocal(new Date("2026-11-01T05:59:00Z"))).toEqual({
			date: "2026-11-01",
			time: "01:59",
		});
		expect(toCommissionLocal(new Date("2026-11-01T06:00:00Z"))).toEqual({
			date: "2026-11-01",
			time: "01:00",
		});
	});

	it("keeps a late evening on its own day, though UTC has moved on", () => {
		expect(toCommissionLocal(new Date("2026-05-15T03:59:00Z"))).toEqual({
			date: "2026-05-14",
			time: "23:59",
		});
		expect(toCommissionLocal(new Date("2026-05-15T04:00:00Z"))).toEqual({
			date: "2026-05-15",
			time: "00:00",
		});
	});

	it("writes midnight as 00, not 24", () => {
		expect(toCommissionLocal(new Date("2026-01-01T05:00:00Z")).time).toBe(
			"00:00",
		);
	});
});

describe("commissionToday", () => {
	it("is the day in Edison, not in UTC", () => {
		// 02:00Z on New Year's Day is still New Year's Eve in New Jersey.
		expect(commissionToday(new Date("2027-01-01T02:00:00Z"))).toBe(
			"2026-12-31",
		);
	});
});

describe("yearOf", () => {
	it("reads the year off the day's own text", () => {
		expect(yearOf("2027-01-01")).toBe(2027);
		expect(yearOf("2026-12-31")).toBe(2026);
	});
});
