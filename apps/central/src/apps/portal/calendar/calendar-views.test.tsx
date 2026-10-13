// @vitest-environment happy-dom
/**
 * The Calendar page's two views, drawn from fixture items: bars that span and continue across
 * weeks, "+N more" past the third lane, the agenda's placement of a multi-day item, and every
 * item's button named in words.
 */
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { type CalendarItem, sortItems } from "@/src/lib/calendar/items";
import { itemAccessibleName } from "@/src/lib/calendar/labels";
import { Agenda } from "./agenda";
import { MonthGrid } from "./month-grid";

afterEach(cleanup);

const item = (
	key: string,
	fields: Partial<CalendarItem> & Pick<CalendarItem, "startsOn">,
): CalendarItem => ({
	endsOn: fields.startsOn,
	key,
	source: "staffEvent",
	status: "normal",
	title: key,
	...fields,
});

// October 2026 starts on a Thursday; its grid runs Sun Sep 27 to Sat Oct 31.
const course = item("course", {
	endsOn: "2026-10-13",
	startsOn: "2026-10-09",
	title: "Pesticide applicator course",
});
const lastMonth = item("conference", {
	endsOn: "2026-10-02",
	source: "staffEvent",
	startsOn: "2026-09-29",
	title: "NJMCA conference",
});
const busyDay = [
	item("holiday", {
		source: "holiday",
		startsOn: "2026-10-21",
		title: "Staff Day",
	}),
	...["08:00", "10:00", "13:00", "15:00"].map((time) =>
		item(`timed-${time}`, {
			startTime: time,
			startsOn: "2026-10-21",
			title: `Session at ${time}`,
		}),
	),
];
const cancelled = item("cancelled", {
	source: "meeting",
	startTime: "19:00",
	startsOn: "2026-10-14",
	status: "cancelled",
	title: "Regular Meeting",
});

const ITEMS = sortItems([course, lastMonth, ...busyDay, cancelled]);
const TODAY = "2026-10-13";

describe("MonthGrid", () => {
	const renderGrid = () =>
		render(<MonthGrid items={ITEMS} month="2026-10" today={TODAY} />);

	it("is a table whose header row names the weekdays, Sunday first", () => {
		renderGrid();
		const headers = screen.getAllByRole("columnheader");
		expect(headers.map((header) => header.textContent)).toEqual([
			"SunSunday",
			"MonMonday",
			"TueTuesday",
			"WedWednesday",
			"ThuThursday",
			"FriFriday",
			"SatSaturday",
		]);
		expect(screen.getAllByRole("row")).toHaveLength(6);
	});

	it("draws a multi-day item as a bar per week, squared off where it continues", () => {
		renderGrid();
		const [first, second] = screen.getAllByRole("button", {
			name: itemAccessibleName(course),
		});
		expect(first?.dataset).toMatchObject({
			continuesAfter: "true",
			span: "2",
		});
		expect(first?.dataset.continuesBefore).toBeUndefined();
		expect(first?.className).toContain("rounded-l");
		expect(first?.className).toContain("rounded-r-none");
		expect(second?.dataset).toMatchObject({
			continuesBefore: "true",
			span: "3",
		});
		expect(second?.className).toContain("rounded-l-none");
	});

	it("shows a timed item as its start time and title, struck through when cancelled", () => {
		renderGrid();
		const button = screen.getByRole("button", {
			name: "Meeting: Regular Meeting, Wednesday, October 14, 2026, 7pm, Cancelled",
		});
		expect(button.textContent).toBe("7pmRegular Meeting");
		expect(button.className).toContain("line-through");
	});

	it("shows three lanes, then +N more listing the whole day", async () => {
		renderGrid();
		expect(
			screen.getByRole("button", {
				name: itemAccessibleName(busyDay[2] as CalendarItem),
			}),
		).toBeTruthy();
		expect(
			screen.queryByRole("button", {
				name: itemAccessibleName(busyDay[3] as CalendarItem),
			}),
		).toBeNull();

		const more = screen.getByRole("button", {
			name: "+2 more on Wednesday, October 21, 2026",
		});
		await act(async () => {
			fireEvent.click(more);
		});
		const popover = await screen.findByRole("dialog");
		for (const { title } of busyDay) {
			expect(within(popover).getByText(title)).toBeTruthy();
		}
	});

	it("marks today's cell", () => {
		renderGrid();
		const today = screen
			.getAllByRole("cell")
			.filter((cell) => cell.getAttribute("aria-current") === "date");
		expect(today).toHaveLength(1);
		expect(today[0]?.textContent).toContain("Tuesday, October 13, 2026, today");
	});

	it("opens an item's details on click and closes them on Escape", async () => {
		renderGrid();
		const [bar] = screen.getAllByRole("button", {
			name: itemAccessibleName(course),
		});
		await act(async () => {
			fireEvent.click(bar as HTMLElement);
		});
		const popover = await screen.findByRole("dialog");
		expect(within(popover).getByText("Staff Event")).toBeTruthy();
		await act(async () => {
			fireEvent.keyDown(popover, { key: "Escape" });
		});
		expect(screen.queryByRole("dialog")).toBeNull();
	});
});

describe("Agenda", () => {
	it("lists the month by day, with a multi-day item from last month on the 1st", () => {
		render(<Agenda items={ITEMS} month="2026-10" today={TODAY} />);
		const days = within(screen.getAllByRole("list")[0] as HTMLElement)
			.getAllByRole("heading", { level: 3 })
			.map((heading) => heading.textContent);
		expect(days).toEqual([
			"Thu, Oct 1",
			"Fri, Oct 9",
			"Wed, Oct 14",
			"Wed, Oct 21",
		]);

		const first = screen.getByRole("heading", { name: "Thu, Oct 1" })
			.parentElement as HTMLElement;
		expect(
			within(first).getByRole("button", {
				name: itemAccessibleName(lastMonth),
			}),
		).toBeTruthy();
		// Listed once, on the day it starts, not on each day it covers.
		expect(
			screen.getAllByRole("button", { name: itemAccessibleName(course) }),
		).toHaveLength(1);
	});

	it("badges a cancelled item in words", () => {
		render(<Agenda items={ITEMS} month="2026-10" today={TODAY} />);
		const row = screen.getByRole("button", {
			name: itemAccessibleName(cancelled),
		});
		expect(within(row).getByText("Cancelled")).toBeTruthy();
	});

	it("says so when the month is empty", () => {
		render(<Agenda items={ITEMS} month="2026-12" today={TODAY} />);
		expect(
			screen.getByText("Nothing on the Calendar in December 2026."),
		).toBeTruthy();
		expect(screen.queryByRole("list")).toBeNull();
	});
});
