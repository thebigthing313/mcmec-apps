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
