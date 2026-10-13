/**
 * The Self Service Portal's `validateSearch` functions, and the `?year=` check it shares with HR.
 *
 * Here rather than beside the screens in `src/apps/portal/`, because a route's `validateSearch`
 * is never code-split: whatever it imports lands in the entry chunk, and `pnpm check-bundle`
 * refuses App code there. So this imports nothing at all.
 */

/** A four-digit `?year=`, or nothing — the screen then supplies this year in Edison. */
export function searchYear(raw: Record<string, unknown>): { year?: number } {
	const year = Number(raw.year);
	return Number.isInteger(year) && year >= 1000 && year <= 9999 ? { year } : {};
}

export type HolidayScheduleSearch = { year?: number };

/**
 * The Holiday Schedule reads one year at a time. An absent or malformed `year` is dropped, and
 * the screen supplies this year in Edison — so the default keeps a clean URL.
 */
export const validateHolidayScheduleSearch = (
	raw: Record<string, unknown>,
): HolidayScheduleSearch => searchYear(raw);
