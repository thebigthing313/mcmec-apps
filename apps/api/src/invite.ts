// Employee invite — POST /api/invite (gated by manage_employees).
//
// Replaces the old Supabase invite-employee edge function. An employee record must already
// exist (created via /api/data/employees) with no login yet. This creates the Better Auth user,
// links it to the employee, and emails a set-password link. App roles are NOT granted here —
// that's a separate manage_users action (avoids manage_employees escalating privileges).

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { z } from "zod";
import { auth } from "./auth";
import { db } from "./db";
import { employees, users } from "./db/schema";
import { getSessionInfo } from "./session";

const inviteSchema = z.object({ email: z.email() });

export async function inviteEmployee(c: Context): Promise<Response> {
	const session = await getSessionInfo(c.req.raw.headers);
	if (!session) return c.json({ error: "unauthenticated" }, 401);
	if (!session.permissions.includes("manage_employees")) {
		return c.json({ error: "forbidden" }, 403);
	}

	const body = await c.req.json().catch(() => null);
	const parsed = inviteSchema.safeParse(body);
	if (!parsed.success) {
		return c.json({ error: "invalid", issues: parsed.error.issues }, 422);
	}
	const email = parsed.data.email.toLowerCase();

	const [employee] = await db
		.select()
		.from(employees)
		.where(eq(employees.email, email))
		.limit(1);
	if (!employee)
		return c.json({ error: "no employee record for that email" }, 404);
	if (employee.userId)
		return c.json({ error: "employee already has a login" }, 409);

	// Create the login with a throwaway password; the invitee sets their own via the emailed link.
	// Uses the admin plugin's createUser (server-side, no headers => no admin-session required)
	// rather than signUpEmail, because public sign-up is disabled (see auth.ts). `role: []` keeps
	// the account permission-less — roles are a separate manage_users action.
	let userId: string;
	try {
		const res = await auth.api.createUser({
			body: {
				email,
				password: randomBytes(24).toString("hex"),
				name: employee.displayName,
				role: [],
			},
		});
		userId = res.user.id;
	} catch (e) {
		return c.json({ error: "could not create login", detail: String(e) }, 409);
	}

	// Link the employee; roll back the user if linking fails.
	try {
		await db
			.update(employees)
			.set({ userId })
			.where(eq(employees.id, employee.id));
	} catch (e) {
		await db.delete(users).where(eq(users.id, userId)); // cascades to account/session
		return c.json({ error: "could not link employee", detail: String(e) }, 500);
	}

	// Send the set-password email (Better Auth mints the tokenized url -> sendResetPassword).
	try {
		await auth.api.requestPasswordReset({
			body: {
				email,
				redirectTo: process.env.AUTH_RESET_URL ?? process.env.BETTER_AUTH_URL,
			},
		});
	} catch (e) {
		// Account is created + linked; the admin can re-send later. Surface, don't roll back.
		return c.json({
			success: true,
			userId,
			emailSent: false,
			detail: String(e),
		});
	}

	return c.json({ success: true, userId, emailSent: true });
}
