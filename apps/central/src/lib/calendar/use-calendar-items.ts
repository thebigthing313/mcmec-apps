import { useLiveQuery } from "@tanstack/react-db";
import { useMemo } from "react";
import type { CentralCollection } from "@/src/lib/collections";
import { type CalendarItem, sortItems } from "./items";
import {
	fromHoliday,
	fromMeeting,
	fromSprayMission,
	fromStaffEvent,
} from "./mappers";

/**
 * The Calendar's items, live, from whichever of its four tables the route asked for.
 *
 * Four live queries rather than one: TanStack DB has no union, and `select` can neither convert a
 * Meeting's instant to Edison's day nor fan a Spray Mission out to its rain date. So each query
 * reads its table whole, and the mapping, merging and sorting happen here in a `useMemo`.
 *
 * A table left out is not queried at all (its live query is disabled), so a surface that shows
 * only Holidays subscribes to only `holidays` — which is what lets its route preload only that,
 * as the registry's rule requires.
 *
 * `isReady` is false until every table passed in has synced, so a surface never says "Nothing
 * scheduled" about a table still loading.
 */
export function useCalendarItems({
	staffEvents,
	holidays,
	meetings,
	spraySchedules,
}: {
	staffEvents?: CentralCollection<"staffEvents">;
	holidays?: CentralCollection<"holidays">;
	meetings?: CentralCollection<"meetings">;
	spraySchedules?: CentralCollection<"spraySchedules">;
}): { items: CalendarItem[]; isReady: boolean } {
	const events = useLiveQuery(
		(q) => (staffEvents ? q.from({ event: staffEvents }) : undefined),
		[staffEvents],
	);
	const days = useLiveQuery(
		(q) => (holidays ? q.from({ holiday: holidays }) : undefined),
		[holidays],
	);
	const held = useLiveQuery(
		(q) => (meetings ? q.from({ meeting: meetings }) : undefined),
		[meetings],
	);
	const missions = useLiveQuery(
		(q) => (spraySchedules ? q.from({ mission: spraySchedules }) : undefined),
		[spraySchedules],
	);

	const items = useMemo(
		() =>
			sortItems([
				...(events.data ?? []).map(fromStaffEvent),
				...(days.data ?? []).map(fromHoliday),
				...(held.data ?? []).map(fromMeeting),
				...(missions.data ?? []).flatMap(fromSprayMission),
			]),
		[events.data, days.data, held.data, missions.data],
	);

	const isReady = [events, days, held, missions].every(
		(query) => !query.isEnabled || query.isReady,
	);

	return { isReady, items };
}
