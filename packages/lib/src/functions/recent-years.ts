/**
 * The public-website year window.
 *
 * The transparency and meetings pages show recent history rather than everything the
 * Commission has ever published. Both windows are counted the same way — the most recent
 * years that actually *have* content, not a rolling cutoff from today — so a Document
 * Category nobody has filed in since 2021 still shows its three most recent fiscal years
 * instead of disappearing from the page.
 *
 * This is a display filter and nothing more. No row is unpublished, archived or deleted,
 * the staff apps keep showing full history, and a record that has dropped off a public
 * page comes back by changing this filter alone.
 */

/** How many years of content each public list shows. */
export const RECENT_YEARS_SHOWN = 3;

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
 * @param windowSize - How many distinct years to keep (defaults to `RECENT_YEARS_SHOWN`)
 *
 * @example
 * keepRecentYears(documents, (doc) => doc.fiscal_year)
 * keepRecentYears(meetings, (meeting) => meeting.meeting_at.getFullYear())
 */
export function keepRecentYears<T>(
	items: readonly T[],
	getYear: (item: T) => number,
	windowSize: number = RECENT_YEARS_SHOWN,
): T[] {
	const years = [...new Set(items.map(getYear))].sort((a, b) => b - a);
	const kept = new Set(years.slice(0, windowSize));

	return items.filter((item) => kept.has(getYear(item)));
}

/**
 * Keep everything still to come, plus the past of the most recent years that have one.
 *
 * The meetings page needs both halves. An upcoming Meeting must never be hidden — its
 * legal notice has to be posted at least 48 hours ahead under P.L. 2025 c.72 — so the
 * window applies to past items only, and is counted over their calendar years alone.
 *
 * @param items - The items to filter
 * @param getDate - Reads an item's date
 * @param now - The instant that divides past from upcoming
 * @param windowSize - How many distinct past years to keep
 */
export function keepUpcomingAndRecentYears<T>(
	items: readonly T[],
	getDate: (item: T) => Date,
	now: Date = new Date(),
	windowSize: number = RECENT_YEARS_SHOWN,
): T[] {
	const isUpcoming = (item: T) => getDate(item).getTime() >= now.getTime();

	const keptPast = new Set(
		keepRecentYears(
			items.filter((item) => !isUpcoming(item)),
			(item) => getDate(item).getFullYear(),
			windowSize,
		),
	);

	return items.filter((item) => isUpcoming(item) || keptPast.has(item));
}
