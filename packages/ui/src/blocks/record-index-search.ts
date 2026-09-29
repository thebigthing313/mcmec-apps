/**
 * The URL half of the record index (./record-index): its search params, and the functions a
 * route hands to TanStack Router's `validateSearch`.
 *
 * Kept apart from the component, with no React or UI import, because a route's `validateSearch`
 * is never code-split: whatever it imports lands in the app's entry chunk. Importing the validator
 * from ./record-index put the whole table, its Select and its row-actions menu in central's first
 * download. Route files import from here; ./record-index re-exports all of it for everyone else.
 */

/** The slice of a route's search params the record index owns. */
export interface RecordIndexSearch {
	q: string;
	page: number;
	size: number;
	sort: string;
	dir: "asc" | "desc";
}

export const RECORD_INDEX_PAGE_SIZES = [25, 50, 100] as const;

/**
 * Default page size.
 *
 * Twenty-five rather than the ten every hand-rolled table defaulted to: these screens are used at
 * a desk on a large display (PRODUCT.md), where ten rows left half the viewport empty while
 * splitting thirty-five records across four pages.
 */
export const RECORD_INDEX_DEFAULT_SIZE = 25;

/**
 * Normalises whatever is in the URL into a complete search state.
 *
 * Belongs here rather than in each route so that sort and page survive a round trip to a detail
 * screen and back — the single most-felt gap in the previous eleven, where returning from a
 * record dropped you on page one with the default sort. Written to be dropped straight into
 * TanStack Router's `validateSearch`.
 */
export function parseRecordIndexSearch(
	raw: Record<string, unknown>,
	defaults: { id: string; dir?: "asc" | "desc" },
): RecordIndexSearch {
	const size = Number(raw.size);
	const page = Number(raw.page);
	return {
		dir:
			raw.dir === "asc" || raw.dir === "desc"
				? raw.dir
				: (defaults.dir ?? "desc"),
		page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
		q: typeof raw.q === "string" ? raw.q : "",
		size: RECORD_INDEX_PAGE_SIZES.includes(
			size as (typeof RECORD_INDEX_PAGE_SIZES)[number],
		)
			? size
			: RECORD_INDEX_DEFAULT_SIZE,
		sort: typeof raw.sort === "string" && raw.sort ? raw.sort : defaults.id,
	};
}

/**
 * The route's `validateSearch`, written once.
 *
 * Nine routes had each copied the same six-line body, which is the duplication this block exists
 * to end, reintroduced one layer up. Only values that differ from the default are emitted, so a
 * clean list keeps a clean URL and a link to the route from anywhere else still needs no search
 * object at all.
 *
 * `extra` carries a route's own filter dimensions — a Notice's status, a Public Request's type.
 */
export function validateRecordIndexSearch<TExtra extends object = object>(
	raw: Record<string, unknown>,
	extra?: (raw: Record<string, unknown>) => TExtra,
): Partial<RecordIndexSearch> & TExtra {
	const page = Number(raw.page);
	const size = Number(raw.size);
	return {
		...(typeof raw.q === "string" && raw.q ? { q: raw.q } : {}),
		...(Number.isFinite(page) && page > 1 ? { page: Math.floor(page) } : {}),
		...(RECORD_INDEX_PAGE_SIZES.includes(
			size as (typeof RECORD_INDEX_PAGE_SIZES)[number],
		)
			? { size }
			: {}),
		...(typeof raw.sort === "string" && raw.sort ? { sort: raw.sort } : {}),
		...(raw.dir === "asc" || raw.dir === "desc" ? { dir: raw.dir } : {}),
		...(extra ? extra(raw) : ({} as TExtra)),
	} as Partial<RecordIndexSearch> & TExtra;
}
