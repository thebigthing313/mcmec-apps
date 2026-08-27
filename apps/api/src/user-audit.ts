// App-layer audit for Better Auth's own writes to `users`.
//
// Every other audited write goes through the `log_mutation` trigger, which reads the actor and
// the command from the per-transaction `app.*` GUCs (see actor.ts). Better Auth writes `users`
// on its own connection, outside our transactions, so those GUCs are never set: the trigger
// still fires and still records the row, but with a null actor and a null command. Closing that
// gap means writing the audit row from here, where the acting user is in hand.
//
// ── Deliberately a no-op ─────────────────────────────────────────────────────
// #144 wires the seam and stops there. The point is that the boundary is real, typed, and in
// one place, so the implementation drops in without touching auth.ts config again — not to
// invent the audit semantics, which belong with the `users` domain commands (#134).
//
// Until it is implemented, Better-Auth-initiated writes audit exactly as they do today: via the
// `audit_users` trigger, with a null actor and a null command. Nothing regresses; nothing new
// is recorded either.
//
// ── What #165 settled, and what it left ──────────────────────────────────────
// This was written expecting one of the `users` domain commands to route through Better Auth,
// and needing a way to pass its name down. None of them does. `grantAppRole`, `revokeAppRole`
// and `inviteEmployee` all write `users` with Drizzle on the dispatcher's transaction, precisely
// so the GUCs are set and `audit_users` names the actor and the command — which is why
// `inviteEmployee` does not call `auth.api.createUser`.
//
// So `command` still has no source here, and now it never will: what is left running through
// these hooks is sign-in, email verification and password reset — writes with no command behind
// them, made by the account holder rather than by an admin. `command: null` is the honest value
// for those, and the open question is no longer "where does the name come from" but "is an actor
// recoverable for a write nobody else initiated", which is a different and much smaller one.

export type UserAuditOperation = "INSERT" | "UPDATE";

export type UserAuditEvent = {
	operation: UserAuditOperation;
	/** The `users` row after the write. */
	recordId: string;
	/** Who performed it, when Better Auth knows. Null for unattributed writes (signup, verification). */
	actorUserId: string | null;
	actorEmail: string | null;
	/** The named domain command behind the write. Always null today — see the module doc. */
	command: string | null;
};

export async function recordUserAudit(_event: UserAuditEvent): Promise<void> {
	// No-op. See the module doc: the seam exists so the implementation has one home.
}
