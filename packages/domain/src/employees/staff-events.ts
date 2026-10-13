/**
 * `staff_events` — the five commands of a Staff Event (CONTEXT.md).
 *
 * The meetings shape (`website/meetings.ts`), less its one precondition: a Staff Event is born
 * uncancelled, `is_cancelled` moves only through `cancelStaffEvent` / `uncancelStaffEvent`, and
 * delete is for an event entered by mistake. Unlike a Meeting, a cancelled Staff Event needs no
 * reason — it is shown to Employees, not published as the Commission's public record — and an
 * event already past may still be cancelled or reinstated, to put the record right.
 *
 * The date and time rules are the row schema's own (`checkStaffEventDates`), so a form shows a
 * field error before the database refuses. On a partial update a pair may arrive half-present;
 * the function skips a rule it cannot see whole, and the table's check constraints decide.
 *
 * `id` appears in no payload — it rides in the envelope and names the row the command is about.
 */
import {
	checkStaffEventDates,
	StaffEventsRowSchema,
} from "@mcmec/schemas/db/staff-events";
import z from "zod";
import { defineDomain } from "../command";

const employees = defineDomain("employees", "manage_employees");
const command = employees.table("staff_events");

const row = StaffEventsRowSchema.shape;

const DetailFields = {
	description: row.description,
	end_time: row.end_time,
	ends_on: row.ends_on,
	location: row.location,
	start_time: row.start_time,
	starts_on: row.starts_on,
	title: row.title,
	url: row.url,
} as const;

/** The lifecycle commands take no fields — the envelope id is the whole request. */
const EmptyPayload = z.object({});

export const createStaffEvent = command(
	"createStaffEvent",
	// No `is_cancelled`: nobody announces an event in order to call it off.
	z
		.object(DetailFields)
		.superRefine(checkStaffEventDates),
	{ creates: true },
);

/**
 * Partial, because the collection handler sends `mutation.changes`. Never `is_cancelled`: with it
 * absent from the schema, Zod strips it, and the lifecycle column can only move through its own
 * two commands (ADR 0001).
 */
export const updateStaffEventDetails = command(
	"updateStaffEventDetails",
	z
		.object(DetailFields)
		.partial()
		.refine((v) => Object.keys(v).length > 0, {
			error: "no fields to update",
		})
		.superRefine(checkStaffEventDates),
);

export const cancelStaffEvent = command("cancelStaffEvent", EmptyPayload);
export const uncancelStaffEvent = command("uncancelStaffEvent", EmptyPayload);
export const deleteStaffEvent = command("deleteStaffEvent", EmptyPayload);

export const STAFF_EVENT_COMMANDS = [
	createStaffEvent,
	updateStaffEventDetails,
	cancelStaffEvent,
	uncancelStaffEvent,
	deleteStaffEvent,
] as const;
