import type { CommandName } from "@mcmec/domain";
import type { AppRole } from "@mcmec/lib/constants/roles";
import { findCommandRefusal, sendCommand } from "@mcmec/sync";
import { API_URL } from "./queryClient";

/**
 * Grants or revokes one app role.
 *
 * `users` is not a synced collection — the grid lists accounts through the admin plugin, not
 * through Electric — so this posts the envelope directly, the way #137 intended for a command no
 * collection owns.
 *
 * One checkbox, one role, one command. The endpoint this replaces took the WHOLE role set: the
 * grid read the current roles, computed the next array and PUT it, so two admins ticking
 * different boxes on the same user each wrote a set that did not include the other's change. The
 * server now does that read-modify-write inside the transaction, and neither `grantAppRole` nor
 * `revokeAppRole` has a shape in which a set could be sent.
 */
export async function setAppRole(
	userId: string,
	role: AppRole,
	granted: boolean,
): Promise<void> {
	const intent: CommandName = granted
		? "users.grantAppRole"
		: "users.revokeAppRole";
	try {
		await sendCommand(API_URL, {
			id: userId,
			intents: [intent],
			role,
		});
	} catch (error) {
		throw new Error(
			findCommandRefusal(error)?.message ?? "Failed to update roles.",
		);
	}
}
