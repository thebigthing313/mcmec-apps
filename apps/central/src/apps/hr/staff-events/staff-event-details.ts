import {
	formatClockTime,
	formatDateShortWithWeekday,
} from "@mcmec/lib/functions/date-fns";
import {
	checkStaffEventDates,
	StaffEventsRowSchema,
} from "@mcmec/schemas/db/staff-events";
import z from "zod";

/**
 * A Staff Event's details — exactly what `employees.createStaffEvent` and
 * `employees.updateStaffEventDetails` take. Never `is_cancelled`: that moves only through the
 * lifecycle commands (ADR 0001).
 */
export type StaffEventDetails = {
	title: string;
	description: string | null;
	starts_on: string;
	ends_on: string | null;
	start_time: string | null;
	end_time: string | null;
	location: string | null;
	url: string | null;
};

/**
 * What the form edits. Text inputs hold "" rather than null, and `all_day` is the form's own
 * choice: it is not stored — an all-day event is one with no start time.
 */
export type StaffEventFormValues = {
	title: string;
	description: string;
	starts_on: string;
	ends_on: string | null;
	all_day: boolean;
	start_time: string;
	end_time: string;
	location: string;
	url: string;
};

const row = StaffEventsRowSchema.shape;

/**
 * The payload's rules, field by field and across fields — the same `checkStaffEventDates` the
 * commands apply, so the form says which field is wrong before the server is asked.
 */
export const StaffEventDetailsSchema = z
	.object({
		description: row.description,
		end_time: row.end_time,
		ends_on: row.ends_on,
		location: row.location,
		start_time: row.start_time,
		starts_on: z.iso.date("Pick the day it starts."),
		title: z.string().trim().min(1, "Give the event a title."),
		url: z.url("Enter a full link, starting https://").nullable(),
	})
	.superRefine(checkStaffEventDates);

const orNull = (value: string) => {
	const trimmed = value.trim();
	return trimmed === "" ? null : trimmed;
};

/** `"13:00:00"` as the `"13:00"` a time input holds, so an untouched time is not a change. */
const toClock = (time: string | null) => (time ? time.slice(0, 5) : null);

/** The form's values as the payload a command takes. */
export function detailsFromForm(
	values: StaffEventFormValues,
): StaffEventDetails {
	const allDay = values.all_day;
	return {
		description: orNull(values.description),
		end_time: allDay ? null : orNull(values.end_time),
		// An end date on the start date says nothing a single day does not, and the single-day
		// rule (end time after start time) only applies when it is null.
		ends_on:
			values.ends_on && values.ends_on !== values.starts_on
				? values.ends_on
				: null,
		location: orNull(values.location),
		start_time: allDay ? null : orNull(values.start_time),
		starts_on: values.starts_on,
		title: values.title.trim(),
		url: orNull(values.url),
	};
}

/** A stored row's details, with times as the form holds them, for diffing against the form. */
export function detailsFromRow(event: StaffEventDetails): StaffEventDetails {
	return {
		description: event.description,
		end_time: toClock(event.end_time),
		ends_on: event.ends_on,
		location: event.location,
		start_time: toClock(event.start_time),
		starts_on: event.starts_on,
		title: event.title,
		url: event.url,
	};
}

/** A stored row as the form's starting values. */
export function formValuesFromRow(
	event: StaffEventDetails,
): StaffEventFormValues {
	return {
		all_day: event.start_time == null,
		description: event.description ?? "",
		end_time: toClock(event.end_time) ?? "",
		ends_on: event.ends_on,
		location: event.location ?? "",
		start_time: toClock(event.start_time) ?? "",
		starts_on: event.starts_on,
		title: event.title,
		url: event.url ?? "",
	};
}

/**
 * "Wed, Oct 21, 2026 · 1:00 PM – 3:00 PM", or "Wed, Oct 21, 2026 – Fri, Oct 23, 2026 · All day".
 */
export function staffEventWhen(event: {
	starts_on: string;
	ends_on: string | null;
	start_time: string | null;
	end_time: string | null;
}): string {
	const days = event.ends_on
		? `${formatDateShortWithWeekday(event.starts_on)} – ${formatDateShortWithWeekday(event.ends_on)}`
		: formatDateShortWithWeekday(event.starts_on);
	if (!event.start_time) return `${days} · All day`;
	const times = event.end_time
		? `${formatClockTime(event.start_time)} – ${formatClockTime(event.end_time)}`
		: formatClockTime(event.start_time);
	return `${days} · ${times}`;
}
