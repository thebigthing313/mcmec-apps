import { findCommandRefusal } from "@mcmec/sync/command-write";
import { toast } from "sonner";

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
 * three drift. It is the one helper that needs both sonner and `@mcmec/sync`, and nothing else
 * imported both: `@mcmec/sync` has neither React nor sonner, and this package had no reason to
 * know about writes. The edge is deliberately narrow — it imports the `@mcmec/sync/command-write`
 * subpath, which itself imports only the route constant, so taking it does not drag TanStack DB
 * or Electric into a page that only wanted a toast.
 *
 * The transaction is typed structurally for the same reason: this file must not know what a
 * collection is.
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
