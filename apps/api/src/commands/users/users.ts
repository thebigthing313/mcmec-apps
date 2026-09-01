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
import {
	MANAGE_USERS,
	parseRoles,
	serializeRoles,
} from "@mcmec/lib/constants/roles";
import { eq } from "drizzle-orm";
import type { Tx } from "../../actor";
import { users } from "../../db/schema";
import { NOT_FOUND } from "../rows";
import { CommandError, type CommandHandler } from "../types";

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
 * Removes one role, refusing the revocation that would lock its own sender out (#141).
 *
 * The permissions grid disables the checkbox, and that guard stays — but it only covers the
 * gesture made through the grid. Anything else that can send a command (curl, a stale tab, a
 * future client that forgets) reaches this handler, and the cost of getting it wrong is an
 * admin who needs direct database access to get their own access back. So the rule is enforced
 * here, where an attacker actually runs, and the client's `disabled` is a courtesy that keeps
 * an admin from clicking something the server would refuse.
 *
 * `409 precondition_failed` rather than `403`: the caller DOES hold `manage_users` — dispatch
 * already checked that, and a 403 here would say otherwise. This is a rule about the gesture,
 * checked against stored state, which is what `archiveNotice`'s retention check is too.
 *
 * Deliberately narrow. Revoking `manage_users` from someone else is fine, revoking any other
 * role from yourself is fine, and whether the caller would still hold `manage_users` by some
 * other route is not asked — targeting yourself with this role is the refusal. Refusing a
 * revocation that would leave the system with zero administrators is a different and harder
 * rule, and it is not this one.
 *
 * The check runs before the row is read, so it answers ahead of `NOT_FOUND`. That ordering can
 * only ever apply to the caller's own id, which is a row that exists by the fact that they are
 * holding a session against it.
 */
export const revokeAppRole: CommandHandler<
	typeof userCommands.revokeAppRole
> = async ({ payload, id, session, tx }) => {
	if (id === session.userId && payload.role === MANAGE_USERS) {
		throw new CommandError(409, {
			error: "precondition_failed",
			message:
				"You cannot revoke your own Manage Users role, because doing so would remove " +
				"your access to this screen. Another administrator has to revoke it for you.",
			reason: "self_revocation",
		});
	}
	await applyRole(tx, id, (roles) => roles.filter((r) => r !== payload.role));
};
