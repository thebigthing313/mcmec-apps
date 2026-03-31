import type { SupabaseClient } from "./types";

/**
 * Process cross-app auth tokens from URL hash fragment (dev only).
 * In production, PKCE flow with shared cookie domain handles this automatically.
 * In dev, tokens are passed via hash fragment since cookies don't share across ports.
 *
 * Call this at the start of a route guard's beforeLoad.
 */
export async function processAuthRedirect(
	client: SupabaseClient,
): Promise<void> {
	const hash = window.location.hash;
	if (hash.includes("access_token")) {
		const params = new URLSearchParams(hash.substring(1));
		const accessToken = params.get("access_token");
		const refreshToken = params.get("refresh_token");
		if (accessToken && refreshToken) {
			await client.auth.setSession({
				access_token: accessToken,
				refresh_token: refreshToken,
			});
		}
		window.history.replaceState(null, "", window.location.pathname);
	}
}
