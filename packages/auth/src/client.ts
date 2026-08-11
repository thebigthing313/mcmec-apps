import { createAuthClient } from "better-auth/client";
import { adminClient } from "better-auth/client/plugins";

/**
 * Better Auth browser client factory.
 *
 * `baseURL` is the API origin (VITE_API_URL). `credentials: "include"` sends the
 * cross-subdomain session cookie on every auth request:
 *   - prod: the shared `.middlesexmosquito.org` cookie (SSO across every subdomain app)
 *   - dev:  the host-only `localhost` cookie, shared across ports (cookies ignore port)
 *
 * The `adminClient` plugin mirrors the server's admin plugin so role/user admin
 * endpoints are typed on the client. The custom-session fields (`employeeId`,
 * `permissions`) are read via `verifyClaims`, which casts `getSession()` to
 * `SessionData` — avoiding a cross-package dependency on the server `auth` type.
 */
export function makeAuthClient(baseURL: string) {
	return createAuthClient({
		baseURL,
		fetchOptions: { credentials: "include" },
		plugins: [adminClient()],
	});
}

export type AuthClient = ReturnType<typeof makeAuthClient>;
