/**
 * Cross-app auth handoff.
 *
 * With Better Auth this is a no-op. The session lives in a cookie shared across apps:
 *   - prod: set on `.middlesexmosquito.org` (crossSubDomainCookies) — every subdomain
 *     app + the API share one session cookie, so SSO needs no client-side handoff.
 *   - dev:  a host-only `localhost` cookie — cookies ignore port, so every localhost
 *     app shares it too (provided all apps use `localhost`, not `127.0.0.1`).
 *
 * Kept as an exported no-op so the `@mcmec/auth/handleCrossAppAuth` subpath and the
 * route-guard call sites stay stable; the Supabase hash-token fallback is gone.
 */
export async function processAuthRedirect(): Promise<void> {
	// intentionally empty — cookie-based SSO handles prod + dev
}
