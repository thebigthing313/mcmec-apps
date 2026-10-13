/**
 * HR's `validateSearch` functions.
 *
 * Here rather than beside the screens in `src/apps/hr/`, because a route's `validateSearch` is
 * never code-split: whatever it imports lands in the entry chunk, and `pnpm check-bundle` refuses
 * App code there. So this imports no component and nothing under `src/apps/`.
 */
import {
	type RecordIndexSearch,
	validateRecordIndexSearch,
} from "@mcmec/ui/blocks/record-index-search";

export type HolidaysSearch = Partial<RecordIndexSearch> & { year?: number };

/**
 * The Holidays list reads one year at a time, the way HR adopts them. An absent `year` is this
 * year in Edison, which the screen supplies — so a clean list keeps a clean URL.
 */
export function validateHolidaysSearch(
	raw: Record<string, unknown>,
): HolidaysSearch {
	return validateRecordIndexSearch(raw, (r) => {
		const year = Number(r.year);
		return Number.isInteger(year) && year >= 1000 && year <= 9999
			? { year }
			: {};
	});
}
