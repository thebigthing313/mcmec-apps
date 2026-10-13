import { describe, expect, it } from "vitest";
import type { CalendarItem } from "./items";
import {
	clockLabel,
	dateTile,
	dayLong,
	dayShort,
	itemAccessibleName,
	monthLabel,
	relativeDay,
	whenLabel,
} from "./labels";

const meeting: CalendarItem = {
	endsOn: "2026-10-21",
	key: "meeting-1",
	source: "meeting",
	startsOn: "2026-10-21",
	startTime: "19:00",
	status: "normal",
	title: "Regular Meeting",
};

describe("day labels", () => {
	it("format the day named, whatever the machine's zone", () => {
		expect(dayLong("2026-10-21")).toBe("Wednesday, October 21, 2026");
		expect(dayShort("2026-01-01")).toBe("Thu, Jan 1");
		expect(monthLabel("2026-10")).toBe("October 2026");
		expect(dateTile("2026-10-07")).toEqual({ day: "7", month: "Oct" });
	});
});

describe("clockLabel", () => {
	it.each([
		["19:00", "7pm"],
		["19:30", "7:30pm"],
		["12:00", "12pm"],
		["00:15", "12:15am"],
		["09:05", "9:05am"],
	])("%s reads %s", (time, label) => {
		expect(clockLabel(time)).toBe(label);
	});
});

describe("whenLabel", () => {
	it("gives a single day's time, or All day", () => {
		expect(whenLabel(meeting)).toBe("7pm");
		expect(whenLabel({ ...meeting, endTime: "21:00" })).toBe("7pm–9pm");
		expect(whenLabel({ ...meeting, startTime: undefined })).toBe("All day");
	});

	it("spans the days of a multi-day item", () => {
		expect(
			whenLabel({ ...meeting, endsOn: "2026-10-23", startTime: undefined }),
		).toBe("Wed, Oct 21 – Fri, Oct 23");
		expect(
			whenLabel({
				...meeting,
				endTime: "16:00",
				endsOn: "2026-10-23",
				startTime: "08:30",
			}),
		).toBe("Wed, Oct 21 – Fri, Oct 23, 8:30am–4pm");
	});
});

describe("relativeDay", () => {
	const today = "2026-10-21"; // a Wednesday

	it.each([
		["2026-10-21", "Today"],
		["2026-10-22", "Tomorrow"],
		["2026-10-23", "Friday"],
		["2026-10-27", "Tuesday"],
		["2026-10-28", "Wed, Oct 28"],
		["2026-10-20", "Tue, Oct 20"],
	])("%s reads %s", (day, label) => {
		expect(relativeDay(day, today)).toBe(label);
	});
});

describe("itemAccessibleName", () => {
	it("names the source, title, date, time and status", () => {
		expect(itemAccessibleName({ ...meeting, status: "cancelled" })).toBe(
			"Meeting: Regular Meeting, Wednesday, October 21, 2026, 7pm, Cancelled",
		);
	});

	it("names both ends of a multi-day item", () => {
		expect(
			itemAccessibleName({
				...meeting,
				endsOn: "2026-10-23",
				source: "staffEvent",
				startTime: undefined,
				title: "NJMCA Annual Meeting",
			}),
		).toBe(
			"Staff Event: NJMCA Annual Meeting, Wednesday, October 21, 2026, until Friday, October 23, 2026",
		);
	});
});
