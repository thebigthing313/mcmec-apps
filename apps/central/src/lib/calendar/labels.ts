/**
 * How a Calendar item reads, in words — shared by the Calendar page, the Dashboard's Upcoming
 * card and the Holiday Schedule, so the three say the same thing about the same item.
 *
 * Days are formatted from their `YYYY-MM-DD` text with `timeZone: "UTC"`, the convention every
 * date-only formatter in `@mcmec/lib` keeps: the day is built at UTC midnight and read back in
 * UTC, so no zone can move it.
 */
import { daysBetween } from "./days";
import {
	type CalendarItem,
	type CalendarItemStatus,
	SOURCE_LABEL,
} from "./items";

function format(day: string, options: Intl.DateTimeFormatOptions): string {
	return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", {
		...options,
		timeZone: "UTC",
	});
}

/** "Wednesday, October 21, 2026" */
export const dayLong = (day: string) =>
	format(day, {
		day: "numeric",
		month: "long",
		weekday: "long",
		year: "numeric",
	});

/** "Wed, Oct 21" */
export const dayShort = (day: string) =>
	format(day, { day: "numeric", month: "short", weekday: "short" });

/** "Thursday" */
export const weekdayName = (day: string) => format(day, { weekday: "long" });

/** "October 2026", for a `YYYY-MM` month. */
export const monthLabel = (month: string) =>
	format(`${month}-01`, { month: "long", year: "numeric" });

/** "Oct" and "21", for a date tile. */
export function dateTile(day: string): { month: string; day: string } {
	return {
		day: String(Number(day.slice(8, 10))),
		month: format(day, { month: "short" }),
	};
}

/** "7pm", "7:30pm", "12pm" — from `HH:MM`. */
export function clockLabel(time: string): string {
	const [h = 0, m = 0] = time.split(":").map(Number);
	const suffix = h >= 12 ? "pm" : "am";
	const hour = h % 12 === 0 ? 12 : h % 12;
	return m === 0
		? `${hour}${suffix}`
		: `${hour}:${`${m}`.padStart(2, "0")}${suffix}`;
}

/** "All day", "7pm", "9am–12pm". */
export function timeLabel(
	item: Pick<CalendarItem, "startTime" | "endTime">,
): string {
	if (!item.startTime) return "All day";
	return item.endTime
		? `${clockLabel(item.startTime)}–${clockLabel(item.endTime)}`
		: clockLabel(item.startTime);
}

/**
 * When an item happens, without its first day: "7pm", or for a multi-day item
 * "Wed, Oct 21 – Fri, Oct 23" (and its times, if it has them).
 */
export function whenLabel(item: CalendarItem): string {
	if (item.startsOn === item.endsOn) return timeLabel(item);
	const days = `${dayShort(item.startsOn)} – ${dayShort(item.endsOn)}`;
	return item.startTime ? `${days}, ${timeLabel(item)}` : days;
}

/**
 * A day as it reads from today: "Today", "Tomorrow", "Thursday" within the week, and
 * "Wed, Oct 21" beyond it — or for a day already past.
 */
export function relativeDay(day: string, today: string): string {
	const ahead = daysBetween(today, day);
	if (ahead === 0) return "Today";
	if (ahead === 1) return "Tomorrow";
	if (ahead > 1 && ahead < 7) return weekdayName(day);
	return dayShort(day);
}

/** The badge an item's status earns, or nothing for an ordinary one. */
export function statusLabel(status: CalendarItemStatus): string | undefined {
	switch (status) {
		case "cancelled":
			return "Cancelled";
		case "delayed":
			return "Delayed";
		case "rainDate":
			return "Rain date";
		case "completed":
			return "Completed";
		case "normal":
			return undefined;
	}
}

/**
 * Struck through: not happening on this day — called off, or moved to a rain date. Colour and
 * strike are never the only signal; the status badge says it in words too.
 */
export const isOff = (item: CalendarItem) =>
	item.status === "cancelled" || item.status === "delayed";

/**
 * The accessible name of an item's button: source, title, date and status, because colour alone
 * must never carry meaning. "Meeting: Regular Meeting, Wednesday, October 21, 2026, 7pm".
 */
export function itemAccessibleName(item: CalendarItem): string {
	const status = statusLabel(item.status);
	return [
		`${SOURCE_LABEL[item.source]}: ${item.title}`,
		dayLong(item.startsOn),
		item.startsOn === item.endsOn
			? timeLabel(item)
			: `until ${dayLong(item.endsOn)}${item.startTime ? `, ${timeLabel(item)}` : ""}`,
		status,
	]
		.filter(Boolean)
		.join(", ");
}
