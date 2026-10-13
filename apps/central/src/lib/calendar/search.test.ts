import { describe, expect, it } from "vitest";
import { calendarSearch, validateCalendarSearch } from "./search";

describe("validateCalendarSearch", () => {
	it("keeps a valid view and month", () => {
		expect(
			validateCalendarSearch({ month: "2026-11", view: "agenda" }),
		).toEqual({ month: "2026-11", view: "agenda" });
	});

	it("drops what it cannot read", () => {
		expect(validateCalendarSearch({ month: "2026-13", view: "week" })).toEqual(
			{},
		);
		expect(validateCalendarSearch({ month: 202611 })).toEqual({});
	});
});

describe("calendarSearch", () => {
	it("leaves out this month and the month grid", () => {
		expect(calendarSearch("2026-10", "month", "2026-10")).toEqual({});
		expect(calendarSearch("2026-11", "agenda", "2026-10")).toEqual({
			month: "2026-11",
			view: "agenda",
		});
	});
});
