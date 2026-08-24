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
		toast.error(refusalMessage(error) ?? message);
	});
}

// The collection wraps a handler's rejection, so walk the cause chain for the refusal.
function refusalMessage(error: unknown): string | undefined {
	let current = error;
	for (let depth = 0; current && depth < 5; depth++) {
		if (
			typeof current === "object" &&
			"name" in current &&
			(current as { name?: string }).name === "CommandRefusedError"
		) {
			return (current as { message?: string }).message;
		}
		current = (current as { cause?: unknown }).cause;
	}
	return undefined;
}
