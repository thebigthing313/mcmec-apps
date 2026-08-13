import { toast } from "sonner";

/**
 * Attaches an error toast to a TanStack DB transaction's `isPersisted` promise.
 * Shows a toast only when the server fails to persist the mutation (optimistic
 * state gets rolled back). No toast on success — the optimistic UI is enough.
 */
export function toastOnError(
	tx: { isPersisted: { promise: Promise<unknown> } },
	message = "Something went wrong. Changes have been rolled back.",
) {
	tx.isPersisted.promise.catch(() => {
		toast.error(message);
	});
}
