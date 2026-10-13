// @vitest-environment happy-dom
/**
 * The Holiday Schedule's table: past Holidays muted, the next one badged, a dash for a Holiday
 * observed on the day it falls, a count beneath — and an empty year that says so only once the
 * table has synced.
 */
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { fromHoliday } from "@/src/lib/calendar/mappers";
import { HolidayScheduleTable } from "./holiday-schedule-table";

afterEach(cleanup);

const HOLIDAYS = [
	{
		falls_on: null,
		id: "1",
		name: "New Year's Day",
		observed_on: "2026-01-01",
	},
	{
		falls_on: "2026-07-04",
		id: "2",
		name: "Independence Day",
		observed_on: "2026-07-03",
	},
	{ falls_on: null, id: "3", name: "Veterans Day", observed_on: "2026-11-11" },
	{ falls_on: null, id: "4", name: "Christmas Day", observed_on: "2026-12-25" },
].map(fromHoliday);

function rowOf(name: string) {
	const row = screen.getByText(name).closest("tr");
	if (!row) throw new Error(`no row for ${name}`);
	return row;
}

describe("HolidayScheduleTable", () => {
	it("mutes past Holidays and badges only the next one", () => {
		render(
			<HolidayScheduleTable
				holidays={HOLIDAYS}
				isReady
				nextKey={HOLIDAYS[2]?.key}
				today="2026-10-13"
				year={2026}
			/>,
		);

		expect(rowOf("New Year's Day").className).toContain(
			"text-muted-foreground",
		);
		expect(rowOf("Independence Day").className).toContain(
			"text-muted-foreground",
		);
		expect(rowOf("Veterans Day").className).not.toContain(
			"text-muted-foreground",
		);
		expect(within(rowOf("Veterans Day")).getByText("Next")).toBeTruthy();
		expect(screen.getAllByText("Next")).toHaveLength(1);
	});

	it("badges nothing in a year whose Holidays are not the next to come", () => {
		// Viewing 2026 from 2025: every row is ahead, but the next Holiday is still in 2025.
		render(
			<HolidayScheduleTable
				holidays={HOLIDAYS}
				isReady
				nextKey="holiday-in-2025"
				today="2025-10-13"
				year={2026}
			/>,
		);

		expect(screen.queryByText("Next")).toBeNull();
		expect(rowOf("New Year's Day").className).not.toContain(
			"text-muted-foreground",
		);
	});

	it("shows the day a Holiday falls on, or a dash when it is observed that day", () => {
		render(
			<HolidayScheduleTable
				holidays={HOLIDAYS}
				isReady
				today="2026-10-13"
				year={2026}
			/>,
		);

		const independence = within(rowOf("Independence Day"));
		expect(independence.getByText("Friday, July 3, 2026")).toBeTruthy();
		expect(independence.getByText("Saturday, July 4, 2026")).toBeTruthy();
		expect(within(rowOf("Christmas Day")).getByText("—")).toBeTruthy();
	});

	it("counts the year's Holidays under the table, naming it", () => {
		render(
			<HolidayScheduleTable
				holidays={HOLIDAYS}
				isReady
				today="2026-10-13"
				year={2026}
			/>,
		);

		expect(
			screen.getByRole("table", { name: "4 Holidays in 2026" }),
		).toBeTruthy();
	});

	it("says a year has no Holidays yet once it has synced", () => {
		render(
			<HolidayScheduleTable
				holidays={[]}
				isReady
				today="2026-10-13"
				year={2027}
			/>,
		);

		expect(screen.getByText("No Holidays entered for 2027 yet.")).toBeTruthy();
		expect(
			screen.getByText(
				"HR adds a year's Holidays once the Commission adopts them.",
			),
		).toBeTruthy();
		expect(screen.queryByRole("table")).toBeNull();
	});

	it("never calls a year empty while it is still loading", () => {
		render(
			<HolidayScheduleTable
				holidays={[]}
				isReady={false}
				today="2026-10-13"
				year={2027}
			/>,
		);

		expect(screen.queryByText(/No Holidays entered/)).toBeNull();
		expect(screen.getByRole("table").getAttribute("aria-busy")).toBe("true");
	});
});
