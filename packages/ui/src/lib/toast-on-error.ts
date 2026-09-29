import { toast } from "sonner";

/** The part of central's `CommandRefusedError` this file reads. */
type CommandRefusal = Error & { name: "CommandRefusedError" };

/**
 * Finds the refusal inside whatever a collection handler's rejection was wrapped in.
 *
 * The collection wraps the handler's error, so the server's sentence sits somewhere down the
 * cause chain. `name` is checked rather than `instanceof` because the class lives in central
 * (`apps/central/src/lib/collections/command-write.ts`) and this package does not import apps.
 * Moved here from the sync package when it was removed (#251): this was its one consumer.
 */
function findCommandRefusal(error: unknown): CommandRefusal | undefined {
	let current = error;
	for (let depth = 0; current && depth < MAX_CAUSE_DEPTH; depth++) {
		if (
			typeof current === "object" &&
			"name" in current &&
			(current as { name?: string }).name === "CommandRefusedError"
		) {
			return current as CommandRefusal;
		}
		current = (current as { cause?: unknown }).cause;
	}
	return undefined;
}

/** Deep enough for the collection's own wrapping; short enough that a cycle cannot hang it. */
const MAX_CAUSE_DEPTH = 5;

/**
 * The sentence a Save-and-X refusal owes the user.
 *
 * ADR 0001 makes a lifecycle button on a dirty form send one request with both intents, and
 * `dispatch.ts` runs every intent in one transaction — so a refused `publishNotice` rolls the
 * field save back with it. The typing survives in the form, which is exactly why the user would
 * otherwise assume it was saved.
 */
const ROLLED_BACK_TOGETHER =
	"Your changes were not saved either \u2014 they are still in the form.";

/**
 * Attaches an error toast to a TanStack DB transaction's `isPersisted` promise.
 *
 * Lives here rather than in each app because #165 was the first slice to need it in more than
 * one — `employees` is written by `hr` and by `admin`, and a third hand-rolled copy is how the
 * three drift. The refusal it looks for is matched by name (see `findCommandRefusal` above), and
 * the transaction is typed structurally, so this file knows neither what a collection is nor
 * where writes are sent.
 *
 * A named command can refuse for a reason worth reading — "this notice was posted 3 days ago,
 * P.L. 2025 c.72 requires seven" — so the server's own sentence wins over the caller's generic
 * fallback whenever there is one. Before commands there was nothing to show: a generic
 * `PATCH /api/data/notices` could only fail with "invalid", so the fallback WAS the message.
 *
 * Pass `savedTogether` for a Save-and-X: whatever the server says, the toast then also says the
 * field save went back with it.
 *
 * Pass `success` where the *successful* case also owes the user a sentence. Silence is a fine
 * acknowledgement for a field save the user can watch land in the form, and a poor one for a
 * command whose whole effect is on a website the user is not looking at: unpublishing a Notice
 * changed what a resident sees and, before this, said nothing at all.
 */
export function toastOnError(
	tx: { isPersisted: { promise: Promise<unknown> } },
	message = "Something went wrong. Changes have been rolled back.",
	options?: { savedTogether?: boolean; success?: string },
) {
	tx.isPersisted.promise.then(
		() => {
			if (options?.success) toast.success(options.success);
		},
		(error: unknown) => {
			const reason = findCommandRefusal(error)?.message ?? message;
			toast.error(
				options?.savedTogether ? `${reason} ${ROLLED_BACK_TOGETHER}` : reason,
			);
		},
	);
}
