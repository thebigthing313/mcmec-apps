/**
 * The public-website year window.
 *
 * The transparency and meetings pages show recent history rather than everything the
 * Commission has ever published. Both windows are counted the same way — the most recent
 * years that actually *have* content, not a rolling cutoff from today — so a Document
 * Category nobody has filed in since 2021 still shows its three most recent fiscal years
 * instead of disappearing from the page.
 *
 * These are display filters and nothing more. No row is unpublished, archived or deleted,
 * the staff apps keep showing full history, and a record that has dropped off a public
 * page comes back by changing this filter alone.
 */

/** How many years of content each public list shows. */
export const RECENT_YEARS_SHOWN = 3;

/** The most recent years present, as a set to test membership against. */
function recentYears(years: Iterable<number>): Set<number> {
	const present = [...new Set(years)].sort((a, b) => b - a);
	return new Set(present.slice(0, RECENT_YEARS_SHOWN));
}

/**
 * Keep only the items falling in the most recent years present in the list.
 *
 * Years are taken from the items themselves, so gaps are skipped rather than counted: a
 * list holding 2025, 2023 and 2021 keeps all three. A list spanning fewer years than the
 * window is returned whole. The caller's ordering is preserved — sorting is the caller's
 * job.
 *
 * @param items - The items to filter
 * @param getYear - Reads an item's year (a fiscal year, or the calendar year of a date)
 *
 * @example
 * keepRecentYears(documents, (doc) => doc.fiscal_year)
 */
export function keepRecentYears<T>(
	items: readonly T[],
	getYear: (item: T) => number,
): T[] {
	const kept = recentYears(items.map(getYear));

	return items.filter((item) => kept.has(getYear(item)));
}

/**
 * Keep everything still to come, plus the past of the most recent years that have one.
 *
 * The meetings page needs both halves. An upcoming Meeting must never be hidden — its
 * legal notice has to be posted at least 48 hours ahead under P.L. 2025 c.72 — so the
 * window applies to past items only, and is counted over their calendar years alone.
 * An upcoming year therefore never spends part of the window.
 *
 * @param items - The items to filter
 * @param getDate - Reads an item's date
 * @param now - The instant that divides past from upcoming
 *
 * @example
 * keepUpcomingAndRecentYears(meetings, (meeting) => meeting.meeting_at)
 */
export function keepUpcomingAndRecentYears<T>(
	items: readonly T[],
	getDate: (item: T) => Date,
	now: Date = new Date(),
): T[] {
	const isUpcoming = (item: T) => getDate(item).getTime() >= now.getTime();

	const keptPastYears = recentYears(
		items
			.filter((item) => !isUpcoming(item))
			.map((item) => getDate(item).getFullYear()),
	);

	return items.filter(
		(item) =>
			isUpcoming(item) || keptPastYears.has(getDate(item).getFullYear()),
	);
}
