import type { AuthClient } from "@mcmec/auth/client";
import { signOut } from "@mcmec/auth/signOut";
import type { RegisteredRouter } from "@tanstack/react-router";
import type { CentralCollections } from "./collections";

/**
 * Central's one way out: ends the Better Auth session, leaves for `/login`, then throws away
 * everything this session loaded — the router's cached route matches and every collection — so
 * nothing one User loaded reaches the next User on a shared workstation.
 *
 * Leaving comes first, so the screens that subscribe to a collection are on their way out when
 * `cleanup()` stops it. (The navigation settles before React commits the unmount, so a live
 * query may still log that its source was cleaned up; it is unmounting, and does not resubscribe.)
 * If signing out fails, nothing is thrown away — the User is still signed in. Once it has
 * succeeded, the rest goes even if the navigation does not.
 *
 * The cached matches go with the collections because each one's context still holds this
 * session's collections (#266). The router reuses a cached match when the next User opens the
 * same route, renders it with that old context while its loader re-runs in the background, and
 * the screen's live query subscribes to a collection `endSession()` already cleaned up — which
 * TanStack DB answers by starting its sync again, for the previous User, alongside the new one.
 */
export async function signOutOfCentral({
	authClient,
	collections,
	router,
}: {
	authClient: AuthClient;
	collections: CentralCollections;
	router: Pick<RegisteredRouter, "clearCache" | "navigate">;
}): Promise<void> {
	await signOut({ client: authClient });
	try {
		await router.navigate({ to: "/login" });
	} finally {
		router.clearCache();
		await collections.endSession();
	}
}
