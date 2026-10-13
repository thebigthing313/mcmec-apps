/**
 * The Calendar's one item shape (CONTEXT.md: Calendar), and its order.
 *
 * Every source — Staff Events, Holidays, Meetings, Spray Missions — is mapped into this before
 * anything draws it (see ./mappers). It holds local days (`YYYY-MM-DD`) and local times
 * (`HH:MM`) in Edison, and no Date and no time zone, so a whole-day item can never slide a day
 * and two items on one day compare as text (#298).
 *
 * Here rather than in `@mcmec/lib`, because `public` never shows a Calendar item.
 */

export type CalendarSource =
	| "staffEvent"
	| "holiday"
	| "meeting"
	| "sprayMission";

/**
 * `delayed` is a Spray Mission's original date once it has been put off; `rainDate` is the extra
 * item drawn on the rain date itself, and `completed` a mission carried out (on its rain date, if
 * it has one — CONTEXT.md: Mission Status).
 */
export type CalendarItemStatus =
	| "normal"
	| "cancelled"
	| "delayed"
	| "rainDate"
	| "completed";

export type CalendarItem = {
	/** Unique across sources: a Spray Mission's rain-date item is the mission's key plus `-rain`. */
	key: string;
	source: CalendarSource;
	title: string;
	startsOn: string;
	/** The same as `startsOn` for a single-day item. */
	endsOn: string;
	/** Absent for a whole-day item. */
	startTime?: string;
	endTime?: string;
	status: CalendarItemStatus;
	location?: string;
	description?: string;
	url?: string;
	/** A Meeting opens its existing Portal page, `/meetings/$meetingId`. */
	meetingId?: string;
	mapUrl?: string;
	/** A Holiday's nominal date, when it differs from the day it is observed. */
	fallsOn?: string;
	/** On a delayed original: its rain date. On a rain-date item: the original date. */
	otherDate?: string;
};

/** The source's name as an Employee reads it — the words that back up its colour. */
export const SOURCE_LABEL: Record<CalendarSource, string> = {
	holiday: "Holiday",
	meeting: "Meeting",
	sprayMission: "Spray Mission",
	staffEvent: "Staff Event",
};

/**
 * Calendar order: by day, then whole-day items before timed ones (a Holiday leads its day), then
 * by time, then by title.
 */
export function compareItems(a: CalendarItem, b: CalendarItem): number {
	if (a.startsOn !== b.startsOn) return a.startsOn < b.startsOn ? -1 : 1;
	if (!a.startTime !== !b.startTime) return a.startTime ? 1 : -1;
	const at = a.startTime ?? "";
	const bt = b.startTime ?? "";
	if (at !== bt) return at < bt ? -1 : 1;
	return a.title.localeCompare(b.title);
}

export function sortItems(items: CalendarItem[]): CalendarItem[] {
	return [...items].sort(compareItems);
}
