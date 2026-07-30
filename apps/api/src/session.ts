import type { Context } from "hono";
import { auth } from "./auth";

export type SessionInfo = {
	userId: string;
	userEmail: string;
	employeeId: string | null;
	permissions: string[];
};

// Resolves the Better Auth session (with our customSession fields) into a flat shape.
// Returns null for anonymous requests.
export async function getSessionInfo(
	headers: Headers,
): Promise<SessionInfo | null> {
	const s = (await auth.api.getSession({ headers })) as {
		user: { id: string; email: string };
		employeeId: string | null;
		permissions: string[];
	} | null;
	if (!s) return null;
	return {
		userId: s.user.id,
		userEmail: s.user.email,
		employeeId: s.employeeId ?? null,
		permissions: s.permissions ?? [],
	};
}

// Gate a handler on a permission. Returns the session, or a 401/403 Response to short-circuit:
//   const s = await requirePermission(c, "manage_users");
//   if (s instanceof Response) return s;
export async function requirePermission(
	c: Context,
	permission: string,
): Promise<SessionInfo | Response> {
	const session = await getSessionInfo(c.req.raw.headers);
	if (!session) return c.json({ error: "unauthenticated" }, 401);
	if (!session.permissions.includes(permission)) {
		return c.json({ error: "forbidden" }, 403);
	}
	return session;
}
