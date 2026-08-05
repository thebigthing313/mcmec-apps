export interface Claims {
	userId: string;
	userEmail: string;
	employeeId: string | null;
	permissions: string[];
}

/**
 * Session payload returned by the API's Better Auth `customSession`
 * (GET /api/auth/get-session). Mirrors `apps/api/src/session.ts` projected onto
 * Better Auth's session object. Declared locally so `@mcmec/auth` stays decoupled
 * from the `apps/api` build (`verifyClaims` casts `getSession()` to this shape).
 */
export interface SessionData {
	user: { id: string; email: string };
	session: unknown;
	employeeId: string | null;
	permissions: string[];
}
