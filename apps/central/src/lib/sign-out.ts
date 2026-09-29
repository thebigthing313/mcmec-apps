import type { AuthClient } from "@mcmec/auth/client";
import { signOut } from "@mcmec/auth/signOut";
import { type RegisteredRouter, useRouter } from "@tanstack/react-router";
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
 *
 * Two limits of `clearCache()`, which empties only the cache:
 *
 * - It relies on the navigation having already moved the signed-in screens' matches into the
 *   cache when it settles. It does today, because central uses no view transitions. Turn those
 *   on and the move happens inside `document.startViewTransition`, after this has run — and the
 *   tests in src/test/sign-out.test.tsx would not notice, since happy-dom has no view transitions.
 * - If the navigation fails, the signed-in screen's match stays current, with its context, and
 *   reaches the cache only on a later navigation — so it could still be revived. Accepted:
 *   `/login` has no loader and nothing to fail on but a chunk download.
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

/**
 * `signOutOfCentral` for a component, with what it needs taken from the router: the shell's
 * user menu and both refusals sign out through this.
 */
export function useSignOutOfCentral(): () => Promise<void> {
	const router = useRouter();
	const { authClient, collections } = router.options.context;
	return () => signOutOfCentral({ authClient, collections, router });
}
