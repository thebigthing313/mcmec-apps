/**
 * What a reader of the public meetings page is looking at.
 *
 * The page's selector used to offer calendar years alone and start on the wall-clock
 * year, which hid a meeting scheduled for next January behind a dropdown — exactly the
 * meeting whose 48-hour notice has to be seen (P.L. 2025 c.72) — and could start on a
 * year it did not itself offer. "Upcoming" is the first option and the default, so what
 * is still to come is what loads; the years below it are for browsing history.
 */
export type MeetingPeriod = "upcoming" | number;

/** The period holding everything still to come. */
export const UPCOMING = "upcoming";

/**
 * The periods worth offering for a set of meetings, in display order.
 *
 * "Upcoming" leads when anything is still to come, followed by every calendar year
 * present, newest first. Years come from the meetings themselves, so the selector can
 * never start on — or offer — a year with no rows behind it.
 */
export function meetingPeriods<T>(
	items: readonly T[],
	getDate: (item: T) => Date,
	now: Date = new Date(),
): MeetingPeriod[] {
	const hasUpcoming = items.some(
		(item) => getDate(item).getTime() >= now.getTime(),
	);
	const years = [
		...new Set(items.map((item) => getDate(item).getFullYear())),
	].sort((a, b) => b - a);

	return hasUpcoming ? [UPCOMING, ...years] : years;
}

/** The period to start on: the first one offered, or nothing when there is nothing. */
export function defaultMeetingPeriod(
	periods: readonly MeetingPeriod[],
): MeetingPeriod | null {
	return periods[0] ?? null;
}

/**
 * Keep the meetings belonging to a period.
 *
 * A calendar year is kept whole — an upcoming meeting in it shows under both its year
 * and "Upcoming", which is what a reader browsing that year expects to find there. The
 * caller's ordering is preserved; sorting is the caller's job.
 */
export function keepMeetingPeriod<T>(
	items: readonly T[],
	getDate: (item: T) => Date,
	period: MeetingPeriod | null,
	now: Date = new Date(),
): T[] {
	if (period === null) {
		return [];
	}
	if (period === UPCOMING) {
		return items.filter((item) => getDate(item).getTime() >= now.getTime());
	}

	return items.filter((item) => getDate(item).getFullYear() === period);
}

/** The selector's text for a period. */
export function meetingPeriodLabel(period: MeetingPeriod): string {
	return period === UPCOMING ? "Upcoming" : `${period}`;
}

/** The row count beside the selector, worded for the period being counted. */
export function meetingPeriodCountLabel(
	count: number,
	period: MeetingPeriod | null,
): string {
	const meetings = `meeting${count === 1 ? "" : "s"}`;

	if (period === null) {
		return `${count} ${meetings}`;
	}
	if (period === UPCOMING) {
		return `${count} upcoming ${meetings}`;
	}

	return `${count} ${meetings} in ${period}`;
}

/** What an empty period says instead of rows. */
export function emptyMeetingPeriodLabel(period: MeetingPeriod | null): string {
	if (period === null) {
		return "No meetings found.";
	}
	if (period === UPCOMING) {
		return "No upcoming meetings scheduled.";
	}

	return `No meetings found for ${period}.`;
}
