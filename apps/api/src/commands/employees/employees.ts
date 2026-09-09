/**
 * Handlers for the four `employees` commands.
 *
 * Three are the usual row-scoped writes. `inviteEmployee` is not: it is the only handler in the
 * system that touches something outside the transaction, and the whole reason `CommandHandler`
 * may return an `AfterCommit` thunk (#137).
 */
import { randomUUID } from "node:crypto";
import type { employees as employeeCommands } from "@mcmec/domain";
import { eq } from "drizzle-orm";
import { auth } from "../../auth";
import { employees, users } from "../../db/schema";
import { toColumnValues } from "../columns";
import { deleteRow, NOT_FOUND, setFields } from "../rows";
import { CommandError, type CommandHandler } from "../types";

/**
 * Born without a login. `user_id` is in no payload, so there is no body that could create an
 * employee already linked to an account — the link is `inviteEmployee`'s to make.
 */
export const addEmployee: CommandHandler<
	typeof employeeCommands.addEmployee
> = async ({ payload, id, tx }) => {
	await tx.insert(employees).values({
		id,
		userId: null,
		...toColumnValues(employees, payload),
	} as typeof employees.$inferInsert);
};

export const updateEmployeeDetails: CommandHandler<
	typeof employeeCommands.updateEmployeeDetails
> = async ({ payload, id, tx }) => {
	await setFields(tx, employees, id, toColumnValues(employees, payload));
};

/**
 * Deletes the employee record. The login, if there is one, survives it.
 *
 * No FK→409 wrapper: nothing in the schema references `employees`. Its own reference runs the
 * other way — `user_id` points at `users` with `onDelete: "set null"` — so deleting an invited
 * employee leaves an account that can still sign in with whatever roles it holds. That is
 * exactly today's behaviour under `DELETE /api/data/employees/:id`, and naming the command has
 * not changed it: revoking access is `users.revokeAppRole`, a different gesture under a
 * different permission, and folding it in here would let `manage_employees` reach into `users`.
 */
export const deleteEmployee: CommandHandler<
	typeof employeeCommands.deleteEmployee
> = async ({ id, tx }) => {
	await deleteRow(tx, employees, id);
};

/**
 * Staffs an employee with a login, and mails them a link to set their password.
 *
 * ── Why the `users` row is written with Drizzle ──────────────────────────────
 * `auth.api.createUser` runs on Better Auth's own connection, outside `tx`. Called from here it
 * would commit whether or not the rest of this handler succeeded, which is why the route this
 * replaces carried a compensating hard delete — a rollback written by hand, correct only for as
 * long as someone maintained it. Writing the row through `tx` instead makes the two writes one
 * fact: either the account exists and the employee points at it, or neither happened.
 *
 * That also fixes the audit trail rather than working around it. The GUCs are set on this
 * transaction, so `audit_users` records the acting admin and `employees.inviteEmployee`; the
 * same insert through Better Auth logs a null actor and a null command, which is the gap
 * `user-audit.ts` was wired as a no-op to hold open. This command does not need it.
 *
 * ── Why there is no password ─────────────────────────────────────────────────
 * The old route minted a throwaway one only so that a credential account would exist. It does
 * not need to: better-auth's `resetPassword` creates the credential account when the invitee
 * follows the link (`api/routes/password.mjs`), so the account is born the moment they choose a
 * password and never holds one nobody chose.
 *
 * ── Why the mail is a thunk ──────────────────────────────────────────────────
 * Sending it is not rollback-able, so it must not run inside a transaction that may still fail.
 * The thunk runs after commit; a failure there is logged and the response still succeeds,
 * because the login genuinely exists by then. The old route reported that case to the caller as
 * `emailSent: false` and the invite badge showed it; there is no channel for it now, and the
 * signal is a server log instead.
 */
export const inviteEmployee: CommandHandler<
	typeof employeeCommands.inviteEmployee
> = async ({ id, tx }) => {
	const [employee] = await tx
		.select({
			displayName: employees.displayName,
			email: employees.email,
			userId: employees.userId,
		})
		.from(employees)
		.where(eq(employees.id, id))
		.limit(1);
	if (!employee) throw NOT_FOUND;
	if (employee.userId) {
		throw new CommandError(409, {
			error: "already_invited",
			message: `${employee.email} already has a login.`,
		});
	}

	// `users.email` is unique, so this would fail on the constraint anyway — but as a 422 from
	// the dispatcher's catch-all, which says nothing the admin can act on. An account already
	// exists under this address and is linked to somebody else, or to nobody.
	const email = employee.email.toLowerCase();
	const [existing] = await tx
		.select({ id: users.id })
		.from(users)
		.where(eq(users.email, email))
		.limit(1);
	if (existing) {
		throw new CommandError(409, {
			error: "email_taken",
			message: `An account already exists for ${email}.`,
		});
	}

	// Permission-less on purpose: `manage_employees` may staff an employee with a login, and
	// granting that login any app access is `manage_users`' separate gesture. A null `role` is
	// how "signs in, can reach nothing" is spelled.
	const userId = randomUUID();
	await tx.insert(users).values({
		email,
		emailVerified: false,
		id: userId,
		name: employee.displayName,
		role: null,
	});
	await setFields(tx, employees, id, { userId });

	// Committed by the time this runs. Better Auth mints the tokenised url and hands it to
	// `sendResetPassword` (see auth.ts), which is the same mail the old route sent.
	return async () => {
		await auth.api.requestPasswordReset({
			body: {
				email,
				redirectTo: process.env.AUTH_RESET_URL ?? process.env.BETTER_AUTH_URL,
			},
		});
		// The one delivery signal left. A throw here is caught by the dispatcher and logged
		// as an after-commit failure, so the two lines together say whether the mail went.
		console.log(`[commands] invite mailed to ${email}`);
	};
};
