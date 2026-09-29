import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { toast } from "sonner";
import type { CentralCollection } from "@/src/lib/collections";
import {
	CommandRefusedError,
	sendCommand,
} from "@/src/lib/collections/command-write";
import { intents, withArguments } from "@/src/lib/intents";

/**
 * Saving a spray mission — the one write in this app that does not always fit a collection.
 *
 * `municipality_ids` is not a column of `spray_schedules`, so a save that changes nothing but
 * the municipality set produces an update whose draft is identical to the live row. TanStack DB
 * treats that as a no-op: it builds no mutation, returns an already-resolved transaction, and
 * `onUpdate` never runs — so the command would never be sent and the user's edit would vanish
 * with a success toast, which is precisely the failure mode this slice exists to remove.
 *
 * So the route is chosen by whether there is anything to be optimistic about. When a column
 * changed, the collection owns the write and the row updates under the user's cursor as usual.
 * When only the municipality set changed, there is no row change to show — the mission's
 * municipalities are read out of the junction collection, which is read-only either way — and
 * the command goes straight to the dispatcher through `sendCommand`, the door #137 added for
 * commands no collection owns. Both paths post the same envelope to the same route.
 */
export async function saveSprayMission(
	{
		apiUrl,
		spraySchedules,
	}: { apiUrl: string; spraySchedules: CentralCollection<"spraySchedules"> },
	id: string,
	changes: Record<string, unknown>,
	municipalityIds: string[] | undefined,
): Promise<void> {
	const args =
		municipalityIds === undefined
			? undefined
			: { municipality_ids: municipalityIds };

	if (Object.keys(changes).length > 0) {
		const tx = spraySchedules.update(
			id,
			withArguments(intents("website.updateSprayMissionDetails"), args),
			(draft) => {
				Object.assign(draft, changes);
			},
		);
		toastOnError(tx, "Failed to update spray mission.");
		return;
	}

	if (!args) return;

	try {
		await sendCommand(apiUrl, {
			id,
			intents: ["website.updateSprayMissionDetails"],
			...args,
		});
	} catch (error) {
		toast.error(
			error instanceof CommandRefusedError
				? error.message
				: "Failed to update the mission's municipalities.",
		);
	}
}

/** Order and duplicates are not part of the set the server stores, so they are not a change. */
export function sameMunicipalities(a: string[], b: string[]): boolean {
	const left = [...new Set(a)].sort();
	const right = [...new Set(b)].sort();
	return left.length === right.length && left.every((id, i) => id === right[i]);
}
