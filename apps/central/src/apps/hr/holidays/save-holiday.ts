import { toast } from "sonner";
import { CommandRefusedError } from "@/src/lib/collections/command-write";
import type { HolidayFieldErrors } from "./holiday-form";

/** The collection wraps a handler's error; the refusal sits somewhere down the cause chain. */
function findRefusal(error: unknown): CommandRefusedError | undefined {
	let current = error;
	for (let depth = 0; current && depth < 5; depth++) {
		if (current instanceof CommandRefusedError) return current;
		current = (current as { cause?: unknown }).cause;
	}
	return undefined;
}

/**
 * Waits for a Holiday write to land, and turns a taken date into a field error.
 *
 * Unlike most of central's forms, these wait before leaving: a second Holiday on a day already
 * closed is refused by the server, and the sentence belongs under the Observed field, where the
 * date can be changed — not in a toast on the page the user was sent to.
 */
export async function saveHoliday(
	tx: { isPersisted: { promise: Promise<unknown> } },
	failure: string,
): Promise<{ saved: true } | { saved: false; errors?: HolidayFieldErrors }> {
	try {
		await tx.isPersisted.promise;
		return { saved: true };
	} catch (error) {
		const refusal = findRefusal(error);
		if (refusal?.reason === "holiday_date_taken") {
			return { errors: { observed_on: refusal.message }, saved: false };
		}
		toast.error(refusal?.message ?? failure);
		return { saved: false };
	}
}
