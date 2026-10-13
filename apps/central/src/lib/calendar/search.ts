/**
 * The Calendar page's `validateSearch` (`/calendar?view=&month=`).
 *
 * Here rather than beside the page in `src/apps/portal/calendar/`, because a route's
 * `validateSearch` is never code-split: whatever it imports lands in the entry chunk, and
 * `pnpm check-bundle` refuses App code there. So this imports nothing at all.
 */

export type CalendarView = "month" | "agenda";

export type CalendarSearch = {
	/** Absent is the month grid. */
	view?: CalendarView;
	/** `YYYY-MM`; absent is this month in Edison, which the page supplies. */
	month?: string;
};

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Keeps what is valid and drops the rest, so a mistyped link opens this month's grid. */
export function validateCalendarSearch(
	raw: Record<string, unknown>,
): CalendarSearch {
	const search: CalendarSearch = {};
	if (raw.view === "month" || raw.view === "agenda") search.view = raw.view;
	if (typeof raw.month === "string" && MONTH.test(raw.month)) {
		search.month = raw.month;
	}
	return search;
}

/**
 * The search for a month and view, leaving out the defaults — the month grid, and this month —
 * so the Calendar as it first opens keeps a clean `/calendar`.
 */
export function calendarSearch(
	month: string,
	view: CalendarView,
	thisMonth: string,
): CalendarSearch {
	return {
		...(month !== thisMonth ? { month } : {}),
		...(view === "agenda" ? { view } : {}),
	};
}
