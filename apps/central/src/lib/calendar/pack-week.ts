import { daysBetween } from "./days";
import type { CalendarItem } from "./items";

/** One item's piece of one week, placed in the month grid. */
export type WeekSegment = {
	item: CalendarItem;
	/** The first column it occupies, 0 (Sunday) to 6 (Saturday). */
	col: number;
	/** How many columns it spans, at least 1. */
	span: number;
	/** Its row within the week, from 0; a surface shows the first few and counts the rest. */
	lane: number;
	/** The item began in an earlier week, so the bar is squared off on the left. */
	continuesBefore: boolean;
	/** The item runs into a later week, so the bar is squared off on the right. */
	continuesAfter: boolean;
};

/**
 * Cuts each item to the week, then packs the pieces into lanes: earliest first and, on the same
 * day, longest first, each into the lowest lane free across every day it spans. Items that sort
 * equal keep the order they came in, so Calendar order (`sortItems`) decides the rest.
 *
 * `week` is the seven days, Sunday first (`monthWeeks`).
 */
export function packWeek(week: string[], items: CalendarItem[]): WeekSegment[] {
	const from = week[0] as string;
	const to = week[6] as string;
	const pieces = items
		.filter((item) => item.endsOn >= from && item.startsOn <= to)
		.map((item) => {
			const start = item.startsOn < from ? from : item.startsOn;
			const end = item.endsOn > to ? to : item.endsOn;
			return {
				col: daysBetween(from, start),
				continuesAfter: item.endsOn > to,
				continuesBefore: item.startsOn < from,
				item,
				span: daysBetween(start, end) + 1,
			};
		})
		.sort((a, b) => a.col - b.col || b.span - a.span);

	const taken: boolean[][] = [];
	return pieces.map((piece) => {
		let lane = 0;
		for (;;) {
			taken[lane] ??= Array<boolean>(7).fill(false);
			const row = taken[lane] as boolean[];
			if (row.slice(piece.col, piece.col + piece.span).every((used) => !used)) {
				row.fill(true, piece.col, piece.col + piece.span);
				break;
			}
			lane++;
		}
		return { ...piece, lane };
	});
}
