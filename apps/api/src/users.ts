// User role management — PUT /api/users/:id/roles (gated by manage_users).
//
// Replaces a user's complete role set (idempotent). Roles live in `users.role` as a
// comma-separated list — the admin-plugin convention that customSession() splits back into
// permissions[]. Written directly (not via auth.api.setRole) inside a transaction with the
// audit GUCs set, so the users audit trigger attributes the change to the acting admin.

import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { z } from "zod";
import { setActor } from "./actor";
import { APP_ROLES } from "./auth";
import { db } from "./db";
import { users } from "./db/schema";
import { requirePermission } from "./session";

const bodySchema = z.object({
	// full replace; [] clears all roles (revokes admin access)
	roles: z
		.array(z.enum(APP_ROLES))
		.max(APP_ROLES.length)
		.transform((r) => [...new Set(r)]),
});

export async function setUserRoles(c: Context): Promise<Response> {
	const session = await requirePermission(c, "manage_users");
	if (session instanceof Response) return session;

	const id = c.req.param("id");
	if (!id) return c.json({ error: "missing id" }, 400);

	const parsed = bodySchema.safeParse(await c.req.json().catch(() => null));
	if (!parsed.success) {
		return c.json({ error: "invalid", issues: parsed.error.issues }, 422);
	}
	// order roles by the canonical list so the stored string is stable
	const roles = APP_ROLES.filter((r) => parsed.data.roles.includes(r));
	const roleValue = roles.length ? roles.join(",") : null;

	const actor = setActor(session, c);
	const [updated] = await db.transaction(async (tx) => {
		await actor(tx);
		return tx
			.update(users)
			.set({ role: roleValue })
			.where(eq(users.id, id))
			.returning({ id: users.id, email: users.email, role: users.role });
	});

	if (!updated) return c.json({ error: "not found" }, 404);
	return c.json({ id: updated.id, email: updated.email, roles });
}
