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
// ── Open question for the implementation ─────────────────────────────────────
// `command` has no source here. Better Auth's hooks run inside its own request handling, not
// inside our command dispatcher, so there is no ambient command name to read — unlike the
// trigger path, where `setCommand` has already stamped the GUC. Whichever of the `users` domain
// commands ends up routed through Better Auth will have to pass its own name down. The field is
// on the event type so that requirement is visible rather than discovered later.

export type UserAuditOperation = "INSERT" | "UPDATE";

export type UserAuditEvent = {
	operation: UserAuditOperation;
	/** The `users` row after the write. */
	recordId: string;
	/** Who performed it, when Better Auth knows. Null for unattributed writes (signup, verification). */
	actorUserId: string | null;
	actorEmail: string | null;
	/** The named domain command behind the write — see the open question above. */
	command: string | null;
};

export async function recordUserAudit(_event: UserAuditEvent): Promise<void> {
	// No-op. See the module doc: the seam exists so the implementation has one home.
}
