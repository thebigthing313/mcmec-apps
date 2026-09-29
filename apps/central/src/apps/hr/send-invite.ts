import type { CommandName } from "@mcmec/domain";
import {
	CommandRefusedError,
	sendCommand,
} from "@/src/lib/collections/command-write";

/**
 * Sends an Employee their Invite — the one Employees write that does not go through the
 * collection.
 *
 * `employees.inviteEmployee` changes exactly one column of this row, `user_id`, and its value is
 * an id the server mints. There is nothing for the client to be optimistic about, and an update
 * whose draft is identical to the live row is DROPPED by TanStack DB: it builds no mutation, the
 * transaction resolves instantly and `onUpdate` never runs — so the command would never be sent
 * and the invite would fail silently behind a success state (#162 found this the hard way).
 *
 * So it goes straight to the dispatcher through `sendCommand`, the door #137 added for commands
 * no collection owns. The linked row streams back through Electric a moment later.
 *
 * Rejects with the server's own sentence — "already has a login", "an account already exists for
 * that address" — which is what the button shows.
 */
export async function sendInvite(
	apiUrl: string,
	employeeId: string,
): Promise<void> {
	try {
		await sendCommand(apiUrl, {
			id: employeeId,
			// `satisfies` rather than `intents()`: this envelope is built by hand rather than
			// handed to a collection, and the check it needs is the same one — that the name is
			// in the vocabulary.
			intents: ["employees.inviteEmployee"] satisfies CommandName[],
		});
	} catch (error) {
		throw new Error(
			error instanceof CommandRefusedError
				? error.message
				: "Could not send the invite.",
		);
	}
}
