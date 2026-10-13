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
	const staffEventRows = useLiveQuery(
		(q) => (staffEvents ? q.from({ event: staffEvents }) : undefined),
		[staffEvents],
	);
	const holidayRows = useLiveQuery(
		(q) => (holidays ? q.from({ holiday: holidays }) : undefined),
		[holidays],
	);
	const meetingRows = useLiveQuery(
		(q) => (meetings ? q.from({ meeting: meetings }) : undefined),
		[meetings],
	);
	const missionRows = useLiveQuery(
		(q) => (spraySchedules ? q.from({ mission: spraySchedules }) : undefined),
		[spraySchedules],
	);

	const items = useMemo(
		() =>
			sortItems([
				...(staffEventRows.data ?? []).map(fromStaffEvent),
				...(holidayRows.data ?? []).map(fromHoliday),
				...(meetingRows.data ?? []).map(fromMeeting),
				...(missionRows.data ?? []).flatMap(fromSprayMission),
			]),
		[staffEventRows.data, holidayRows.data, meetingRows.data, missionRows.data],
	);

	const isReady = [staffEventRows, holidayRows, meetingRows, missionRows].every(
		(query) => !query.isEnabled || query.isReady,
	);

	return { isReady, items };
}
