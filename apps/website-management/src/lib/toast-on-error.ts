import { findCommandRefusal } from "@mcmec/sync";
import { toast } from "sonner";

/**
 * Attaches an error toast to a TanStack DB transaction's `isPersisted` promise.
 *
 * A named command can refuse for a reason worth reading — "this notice was posted 3 days ago,
 * P.L. 2025 c.72 requires seven" — so the server's own sentence wins over the caller's generic
 * fallback whenever there is one. Before commands there was nothing to show: a generic
 * `PATCH /api/data/notices` could only fail with "invalid", so the fallback WAS the message.
 */
export function toastOnError(
	tx: { isPersisted: { promise: Promise<unknown> } },
	message = "Something went wrong. Changes have been rolled back.",
) {
	tx.isPersisted.promise.catch((error: unknown) => {
		toast.error(findCommandRefusal(error)?.message ?? message);
	});
}
