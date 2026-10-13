/**
 * One mapper per source, each turning a row into the Calendar's items (./items).
 *
 * TanStack DB has no union, and a live query's `select` can do neither the time-zone conversion
 * a Meeting needs nor the fan-out a Spray Mission does, so this runs in plain code over each
 * query's rows (see ./use-calendar-items).
 */
import { toCommissionLocal } from "@mcmec/lib/functions/date-fns";
import type { HolidaysRowType } from "@mcmec/schemas/db/holidays";
import type { MeetingsRowType } from "@mcmec/schemas/db/meetings";
import type { SpraySchedulesRowType } from "@mcmec/schemas/db/spray-schedules";
import type { StaffEventsRowType } from "@mcmec/schemas/db/staff-events";
import { dayOfUtcDate } from "./days";
import type { CalendarItem } from "./items";

/** A `time` column's `HH:MM:SS` as the `HH:MM` the Calendar holds. */
const clock = (time: string) => time.slice(0, 5);

/** Nullable columns become absent keys, so an item never carries `undefined`'s cousin `null`. */
const optional = (value: string | null | undefined) => value ?? undefined;

type StaffEventRow = Pick<
	StaffEventsRowType,
	| "id"
	| "title"
	| "description"
	| "starts_on"
	| "ends_on"
	| "start_time"
	| "end_time"
	| "location"
	| "url"
	| "is_cancelled"
>;

/** A Staff Event's days are already local text; they pass straight through. */
export function fromStaffEvent(event: StaffEventRow): CalendarItem {
	return {
		description: optional(event.description),
		endsOn: event.ends_on ?? event.starts_on,
		endTime: event.end_time ? clock(event.end_time) : undefined,
		key: `staffEvent-${event.id}`,
		location: optional(event.location),
		source: "staffEvent",
		startsOn: event.starts_on,
		startTime: event.start_time ? clock(event.start_time) : undefined,
		status: event.is_cancelled ? "cancelled" : "normal",
		title: event.title,
		url: optional(event.url),
	};
}

type HolidayRow = Pick<
	HolidaysRowType,
	"id" | "name" | "observed_on" | "falls_on"
>;

/** A Holiday is always a whole day, on the day it is observed. */
export function fromHoliday(holiday: HolidayRow): CalendarItem {
	return {
		endsOn: holiday.observed_on,
		fallsOn: optional(holiday.falls_on),
		key: `holiday-${holiday.id}`,
		source: "holiday",
		startsOn: holiday.observed_on,
		status: "normal",
		title: holiday.name,
	};
}

type MeetingRow = Pick<
	MeetingsRowType,
	"id" | "name" | "location" | "meeting_at" | "notes" | "is_cancelled"
>;

/** A Meeting is an instant; it lands on the day and time it is held in Edison. */
export function fromMeeting(meeting: MeetingRow): CalendarItem {
	const { date, time } = toCommissionLocal(new Date(meeting.meeting_at));
	return {
		description: optional(meeting.notes),
		endsOn: date,
		key: `meeting-${meeting.id}`,
		location: meeting.location,
		meetingId: meeting.id,
		source: "meeting",
		startsOn: date,
		startTime: time,
		status: meeting.is_cancelled ? "cancelled" : "normal",
		title: meeting.name,
	};
}

type SprayMissionRow = Pick<
	SpraySchedulesRowType,
	| "id"
	| "area_description"
	| "mission_date"
	| "rain_date"
	| "start_time"
	| "end_time"
	| "map_url"
	| "status"
>;

/**
 * A Spray Mission is one item, or two once it has a rain date in play.
 *
 * `mission_date` and `rain_date` sync through the shared parser as UTC-midnight Dates, so they
 * are read back with the UTC getters (`dayOfUtcDate`) — the local ones would name the day before.
 *
 * | Status    | rain date | Items                                                         |
 * | --------- | --------- | ------------------------------------------------------------- |
 * | Scheduled | any       | original, normal                                              |
 * | Cancelled | any       | original, cancelled                                           |
 * | Delayed   | set       | original, delayed (moved to the rain date) + rain date, rainDate |
 * | Delayed   | null      | original, delayed                                             |
 * | Completed | set       | original, delayed (it moved) + rain date, completed            |
 * | Completed | null      | original, completed                                           |
 *
 * A Completed mission that still carries a rain date was carried out on its rain date
 * (CONTEXT.md: Mission Status), which is why its original date reads as delayed.
 */
export function fromSprayMission(mission: SprayMissionRow): CalendarItem[] {
	const original = dayOfUtcDate(new Date(mission.mission_date));
	const rain = mission.rain_date
		? dayOfUtcDate(new Date(mission.rain_date))
		: undefined;
	const base = {
		endTime: clock(mission.end_time),
		location: mission.area_description,
		mapUrl: optional(mission.map_url),
		source: "sprayMission" as const,
		startTime: clock(mission.start_time),
		title: mission.area_description,
	};
	const key = `sprayMission-${mission.id}`;
	const on = (
		day: string,
		status: CalendarItem["status"],
		suffix = "",
		otherDate?: string,
	): CalendarItem => ({
		...base,
		endsOn: day,
		key: `${key}${suffix}`,
		otherDate,
		startsOn: day,
		status,
	});

	switch (mission.status) {
		case "scheduled":
			return [on(original, "normal")];
		case "cancelled":
			return [on(original, "cancelled")];
		case "delayed":
			return rain
				? [
						on(original, "delayed", "", rain),
						on(rain, "rainDate", "-rain", original),
					]
				: [on(original, "delayed")];
		case "completed":
			return rain
				? [
						on(original, "delayed", "", rain),
						on(rain, "completed", "-rain", original),
					]
				: [on(original, "completed")];
	}
}
