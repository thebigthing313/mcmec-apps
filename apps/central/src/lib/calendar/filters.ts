/**
 * The three ways a Calendar surface narrows the merged items: a month, the next few, a year of
 * Holidays. Each takes items already in Calendar order (`sortItems`) and keeps it.
 */
import { lastDayOf } from "./days";
import type { CalendarItem } from "./items";

/** Items touching any day from `from` to `to`, inclusive — a multi-day item counts on each. */
export function itemsBetween(
	items: CalendarItem[],
	from: string,
	to: string,
): CalendarItem[] {
	return items.filter((item) => item.endsOn >= from && item.startsOn <= to);
}

/** Items touching a `YYYY-MM` month, including one that began before it or runs past it. */
export function monthItems(
	items: CalendarItem[],
	month: string,
): CalendarItem[] {
	return itemsBetween(items, `${month}-01`, lastDayOf(month));
}

/**
 * What is coming up, for the Dashboard: the first `limit` items that have not ended.
 *
 * - An item already under way counts (`endsOn >= today`), so a three-day course is listed on its
 *   second day.
 * - A Cancelled item stays: an Employee who remembers it should see that it was called off.
 * - A Completed Spray Mission is dropped — it is done, and not something to plan around.
 * - A Delayed original is dropped when its rain-date item exists, which is the one to plan
 *   around; one delayed with no rain date yet stays, as the only word on it.
 *
 * No look-ahead limit: the fifth item may be months away, which is itself worth knowing.
 */
export function upcomingItems(
	items: CalendarItem[],
	today: string,
	limit = 5,
): CalendarItem[] {
	return items
		.filter((item) => item.endsOn >= today)
		.filter(
			(item) =>
				!(
					item.source === "sprayMission" &&
					(item.status === "completed" ||
						(item.status === "delayed" && item.otherDate))
				),
		)
		.slice(0, limit);
}

/** A year's Holidays, which belong to the year they are observed in (CONTEXT.md: Holiday). */
export function holidaysInYear(
	items: CalendarItem[],
	year: number,
): CalendarItem[] {
	return items.filter(
		(item) => item.source === "holiday" && item.startsOn.startsWith(`${year}-`),
	);
}
