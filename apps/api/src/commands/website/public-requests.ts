/**
 * Handlers for the four `public_requests` commands.
 *
 * Three run from the dispatcher like every other handler. `submitPublicRequest` runs from
 * `POST /api/requests` instead — the route in `../../requests.ts` opens the transaction, stamps
 * the GUCs and calls this function directly. That is the whole of what "the handler is shared,
 * the route is not" means in code: the write, its refusals and its audit row are here, and what
 * stays on the route is the part that only an anonymous door needs — the honeypot and the
 * Turnstile verification.
 */
import type { publicRequests as requestCommands } from "@mcmec/domain";
import { publicRequests } from "../../db/schema";
import { deleteRow, setFields } from "../rows";
import type { CommandHandler } from "../types";

/**
 * A member of the public submits a request.
 *
 * `session` is `null` here and typed that way — there is nobody signed in, so the audit row
 * this write produces names the command and the IP but no actor. That is a gain over the
 * pre-command path, which logged `command = null` as well.
 *
 * The payload is the intake contract's discriminated union, so only `general_inquiry` is
 * guaranteed to carry an email and only the three field-service types carry a contact block.
 * Widening once and defaulting to `null` is what the columns say too: everything but
 * `request_type`, `name` and `details` is nullable, precisely because the four types answer
 * different questions.
 *
 * `status` is not set. The column defaults to `new`, which is the same fact the vocabulary
 * states by giving no command a way to write a status other than through `resolveRequest` and
 * `reopenRequest`.
 */
export const submitPublicRequest: CommandHandler<
	typeof requestCommands.submitPublicRequest
> = async ({ payload, id, tx }) => {
	// The union's branches share these keys but not their optionality; the columns are nullable
	// for the same reason, so one widening here beats a switch that would write the same insert
	// four times.
	const request = payload as {
		requestType: string;
		name: string;
		email?: string;
		phone?: string;
		addressLine1?: string;
		addressLine2?: string;
		zipCodeId?: string;
		details: Record<string, unknown>;
	};

	await tx.insert(publicRequests).values({
		// Minted by the route rather than by the column default, so it can be returned to the
		// submitter without a `returning()` round trip — and so a retry of the same submission
		// collides on the primary key instead of filing a second request.
		id,
		addressLine1: request.addressLine1 ?? null,
		addressLine2: request.addressLine2 ?? null,
		details: request.details,
		email: request.email ?? null,
		name: request.name,
		phone: request.phone ?? null,
		requestType: request.requestType,
		zipCodeId: request.zipCodeId ?? null,
	});
};

/**
 * Triaged and done with.
 *
 * Accepted from any status, `in_progress` included: #134 declined to invent transition ordering
 * for this table and this slice does not promote it. What the screen offers still depends on the
 * current status — that is presentation, not a precondition.
 */
export const resolveRequest: CommandHandler<
	typeof requestCommands.resolveRequest
> = async ({ id, tx }) => {
	await setFields(tx, publicRequests, id, { status: "resolved" });
};

/**
 * Back to the triage queue.
 *
 * Reopening returns a request to `new` rather than to whatever it held before. There is nothing
 * to restore: `in_progress` is a state no command can reach, so `new` is the only place a
 * reopened request could go.
 */
export const reopenRequest: CommandHandler<
	typeof requestCommands.reopenRequest
> = async ({ id, tx }) => {
	await setFields(tx, publicRequests, id, { status: "new" });
};

/**
 * Deletes the submission outright, contact details and all.
 *
 * No foreign-key mapping, unlike the other deleting handlers: nothing references
 * `public_requests`. Its own reference runs the other way — `zip_code_id` points at
 * `zip_codes`, whose `onDelete: "restrict"` protects the zip code, not this row.
 */
export const deleteRequest: CommandHandler<
	typeof requestCommands.deleteRequest
> = async ({ id, tx }) => {
	await deleteRow(tx, publicRequests, id);
};
