// Per-transaction audit-actor context.
//
// The append-only `log_mutation` trigger reads who/where from the `app.*` GUCs. Any write path
// that wants the audit row attributed to a user must run inside a transaction and call the
// returned setter first (see data.ts, users.ts). Shared so the GUC contract can't drift.

import { sql } from "drizzle-orm";
import type { Context } from "hono";
import type { db } from "./db";
import type { SessionInfo } from "./session";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Returns a fn that stamps the per-transaction audit GUCs (is_local => rolled back with the tx).
export function setActor(session: SessionInfo, c: Context) {
	const ip =
		c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for") ?? "";
	const requestId = c.req.header("x-request-id") ?? "";
	return async (tx: Tx) => {
		await tx.execute(
			sql`select set_config('app.actor_user_id', ${session.userId}, true)`,
		);
		await tx.execute(
			sql`select set_config('app.actor_email', ${session.userEmail}, true)`,
		);
		await tx.execute(
			sql`select set_config('app.request_id', ${requestId}, true)`,
		);
		await tx.execute(sql`select set_config('app.ip_address', ${ip}, true)`);
	};
}
