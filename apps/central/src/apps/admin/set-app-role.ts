import type { CommandName } from "@mcmec/domain";
import type { AppRole } from "@mcmec/lib/constants/roles";
import {
	CommandRefusedError,
	sendCommand,
} from "@/src/lib/collections/command-write";

/**
 * Grants or revokes one App Role.
 *
 * `users` is not a synced collection — the grid lists logins through Better Auth's admin plugin,
 * not through Electric — so this posts the envelope directly, the way #137 intended for a command
 * no collection owns.
 *
 * One checkbox, one role, one command. The endpoint this replaced took the WHOLE role set, so two
 * admins ticking different boxes on the same User each wrote a set without the other's change.
 * The server now does that read-modify-write inside the transaction, and neither `grantAppRole`
 * nor `revokeAppRole` has a shape in which a set could be sent.
 */
export async function setAppRole(
	apiUrl: string,
	{
		granted,
		role,
		userId,
	}: { userId: string; role: AppRole; granted: boolean },
): Promise<void> {
	const intent: CommandName = granted
		? "users.grantAppRole"
		: "users.revokeAppRole";
	try {
		await sendCommand(apiUrl, { id: userId, intents: [intent], role });
	} catch (error) {
		throw new Error(
			error instanceof CommandRefusedError
				? error.message
				: "Failed to update roles.",
		);
	}
}
