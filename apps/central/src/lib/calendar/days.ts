/**
 * Arithmetic on `YYYY-MM-DD` days.
 *
 * Done on UTC Dates, which have no daylight saving, so adding a day is always 24 hours and the
 * machine's own zone never enters into it. The Date never leaves this module: what goes in and
 * comes out is the day as text.
 */

function toUtc(day: string): Date {
	const [y = 0, m = 1, d = 1] = day.split("-").map(Number);
	return new Date(Date.UTC(y, m - 1, d));
}

function fromUtc(date: Date): string {
	return date.toISOString().slice(0, 10);
}

/** A Date that names a day (`date` columns synced as UTC midnight) as the day it names. */
export function dayOfUtcDate(date: Date): string {
	return fromUtc(date);
}

export function addDays(day: string, n: number): string {
	const date = toUtc(day);
	date.setUTCDate(date.getUTCDate() + n);
	return fromUtc(date);
}

/** Whole days from `from` to `to` — negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
	return Math.round((toUtc(to).getTime() - toUtc(from).getTime()) / 86_400_000);
}

/** 0 for Sunday through 6 for Saturday. */
export function weekdayOf(day: string): number {
	return toUtc(day).getUTCDay();
}

/** `"2026-10"` plus `n` months. */
export function shiftMonth(month: string, n: number): string {
	const [y = 0, m = 1] = month.split("-").map(Number);
	return fromUtc(new Date(Date.UTC(y, m - 1 + n, 1))).slice(0, 7);
}

/** The last day of a `YYYY-MM` month. */
export function lastDayOf(month: string): string {
	return addDays(`${shiftMonth(month, 1)}-01`, -1);
}

/**
 * The Sunday-to-Saturday weeks that cover a month, each as seven days. The first and last weeks
 * carry the neighbouring months' days, as a wall calendar does.
 */
export function monthWeeks(month: string): string[][] {
	const first = `${month}-01`;
	const last = lastDayOf(month);
	const start = addDays(first, -weekdayOf(first));
	const end = addDays(last, 6 - weekdayOf(last));
	const weeks: string[][] = [];
	for (let sunday = start; sunday <= end; sunday = addDays(sunday, 7)) {
		weeks.push(Array.from({ length: 7 }, (_, i) => addDays(sunday, i)));
	}
	return weeks;
}
