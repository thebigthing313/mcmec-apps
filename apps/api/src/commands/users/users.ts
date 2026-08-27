/**
 * Handlers for the two `users` commands.
 *
 * `PUT /api/users/:id/roles` took the whole role set and wrote it. The read-modify-write it was
 * doing did not disappear — it moved to the server, inside the transaction — and that move is
 * the fix: two admins ticking different boxes on the same row now each apply their own role to
 * whatever the row holds at the moment they commit, instead of each overwriting the set they
 * read before the other clicked.
 *
 * Neither handler touches Better Auth. `users.role` is a column of a table Drizzle owns, so the
 * write runs on this transaction with the audit GUCs set — which is what makes `audit_users` say
 * who granted what, rather than recording a null actor for a write that came in over the
 * plugin's own connection.
 */
import type { users as userCommands } from "@mcmec/domain";
import type { AppRole } from "@mcmec/lib/constants/roles";
import { parseRoles, serializeRoles } from "@mcmec/lib/constants/roles";
import { eq } from "drizzle-orm";
import type { Tx } from "../../actor";
import { users } from "../../db/schema";
import { NOT_FOUND } from "../rows";
import type { CommandHandler } from "../types";

/**
 * Applies one role change to the set the row holds right now.
 *
 * The read is inside the caller's transaction, so it sees a concurrent grant that has committed
 * and blocks on one that has not. `parseRoles` drops anything unrecognised, which is how a role
 * retired from `APP_ROLES` stops being carried forward by the next unrelated grant.
 */
async function applyRole(
	tx: Tx,
	id: string,
	change: (roles: AppRole[]) => AppRole[],
): Promise<void> {
	const [row] = await tx
		.select({ role: users.role })
		.from(users)
		.where(eq(users.id, id))
		.limit(1);
	if (!row) throw NOT_FOUND;

	const next = serializeRoles(change(parseRoles(row.role)));
	// Unconditional, even when the set is unchanged: re-granting a role a user already holds is
	// idempotent, and writing anyway leaves an audit row saying the gesture was made.
	await tx.update(users).set({ role: next }).where(eq(users.id, id));
}

export const grantAppRole: CommandHandler<
	typeof userCommands.grantAppRole
> = async ({ payload, id, tx }) => {
	await applyRole(tx, id, (roles) => [...roles, payload.role]);
};

/**
 * Removes one role.
 *
 * It does NOT refuse an admin revoking their own `manage_users` — that hole is guarded only by a
 * `disabled` prop on the client, and it is #141, ruled out of scope on the map. Naming the
 * command has not made it easier to hit: the request still has to name a role and a user, and
 * `manage_users` is still required to send it.
 */
export const revokeAppRole: CommandHandler<
	typeof userCommands.revokeAppRole
> = async ({ payload, id, tx }) => {
	await applyRole(tx, id, (roles) => roles.filter((r) => r !== payload.role));
};
