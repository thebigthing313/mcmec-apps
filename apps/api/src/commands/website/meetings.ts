/**
 * Handlers for the five `meetings` commands.
 *
 * Each runs inside the request's shared transaction and refuses by throwing `CommandError`.
 * Note what a lifecycle handler is: a named row-scoped `set`, with the precondition (if any)
 * checked against stored state rather than against what the client sent.
 */
import type { meetings as meetingCommands } from "@mcmec/domain";
import { eq } from "drizzle-orm";
import { meetings } from "../../db/schema";
import { toColumnValues } from "../columns";
import {
	deleteRow,
	isForeignKeyViolation,
	NOT_FOUND,
	setFields,
} from "../rows";
import { CommandError, type CommandHandler } from "../types";

/** Shortest cancellation reason that says anything — the bound the edit form already used. */
const MIN_REASON_LENGTH = 5;

export const createMeeting: CommandHandler<
	typeof meetingCommands.createMeeting
> = async ({ payload, id, tx }) => {
	// The envelope id is honoured, so the optimistic row's key IS the committed row's id —
	// which is the divergence `data.ts` had by stripping it, and what makes a retried
	// create idempotent against the primary key instead of duplicating.
	await tx.insert(meetings).values({
		id,
		isCancelled: false,
		...toColumnValues(meetings, payload),
	} as typeof meetings.$inferInsert);
};

export const updateMeetingDetails: CommandHandler<
	typeof meetingCommands.updateMeetingDetails
> = async ({ payload, id, tx }) => {
	await setFields(tx, meetings, id, toColumnValues(meetings, payload));
};

/**
 * A cancelled meeting has to say why.
 *
 * This is the third of #134's three form-only rules promoted to a server precondition, and the
 * one this slice carries. It lived as a conditional `onBlur` validator on the notes field,
 * revalidated whenever the `is_cancelled` switch moved — a rule the generic
 * `PATCH /api/data/meetings` could not see, because the switch and the notes arrived as two
 * indistinguishable columns of one row.
 *
 * It reads STORED notes, not the request: a Save-and-Cancel sends `updateMeetingDetails` first
 * in the same transaction, so a reason typed into the form is already on the row by the time
 * this runs, and a bare Cancel from the detail view is judged on what the meeting actually
 * holds. Cancelling does not clear notes on the way back out — `uncancelMeeting` leaves them,
 * because notes is an ordinary field that a scheduled meeting may also carry.
 */
export const cancelMeeting: CommandHandler<
	typeof meetingCommands.cancelMeeting
> = async ({ id, tx }) => {
	const [row] = await tx
		.select({ notes: meetings.notes })
		.from(meetings)
		.where(eq(meetings.id, id));
	if (!row) throw NOT_FOUND;

	if ((row.notes ?? "").trim().length < MIN_REASON_LENGTH) {
		throw new CommandError(409, {
			error: "precondition_failed",
			message:
				"A cancelled meeting has to say why it was cancelled. Put the reason in " +
				"the meeting's notes, then cancel it.",
			reason: "cancellation_reason_required",
		});
	}

	await setFields(tx, meetings, id, { isCancelled: true });
};

export const uncancelMeeting: CommandHandler<
	typeof meetingCommands.uncancelMeeting
> = async ({ id, tx }) => {
	await setFields(tx, meetings, id, { isCancelled: false });
};

export const deleteMeeting: CommandHandler<
	typeof meetingCommands.deleteMeeting
> = async ({ id, tx }) => {
	try {
		await deleteRow(tx, meetings, id);
	} catch (e) {
		// Nothing references `meetings` today, so this branch is defensive rather than
		// observed — but a deleting handler owns the FK->409 mapping itself, and a table that
		// later gains a referrer should not start returning 500s to say "still in use".
		if (isForeignKeyViolation(e)) {
			throw new CommandError(409, {
				error: "conflict",
				message: "This meeting is still referenced and cannot be deleted.",
				reason: "still_referenced",
			});
		}
		throw e;
	}
};
