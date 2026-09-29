import type { AuthClient } from "@mcmec/auth/client";
import { signOut } from "@mcmec/auth/signOut";
import type { CentralCollections } from "./collections";

/**
 * Central's one way out: ends the Better Auth session, leaves for `/login`, then throws away
 * every collection this session built, so nothing one User loaded reaches the next User on a
 * shared workstation.
 *
 * The collections go last. Leaving first unmounts every screen that subscribes to them, so
 * `cleanup()` stops streams nobody is reading rather than pulling rows out from under a mounted
 * live query. If signing out fails, nothing is thrown away — the User is still signed in. Once it
 * has succeeded, the collections go even if the navigation does not.
 */
export async function signOutOfCentral({
	authClient,
	collections,
	toLogin,
}: {
	authClient: AuthClient;
	collections: CentralCollections;
	toLogin: () => Promise<unknown>;
}): Promise<void> {
	await signOut({ client: authClient });
	try {
		await toLogin();
	} finally {
		await collections.endSession();
	}
}
