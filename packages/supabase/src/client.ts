import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type SupabaseClient = ReturnType<typeof createSupabaseClient<Database>>;

const isProduction =
	typeof window !== "undefined" &&
	window.location.hostname.includes("middlesexmosquito.org");

/**
 * Cookie-based storage adapter for cross-subdomain session sharing.
 * Sets cookies on .middlesexmosquito.org so all subdomains share the session.
 */
const cookieStorage = {
	getItem: (key: string): string | null => {
		const match = document.cookie.match(
			new RegExp(`(^| )${encodeURIComponent(key)}=([^;]+)`),
		);
		return match?.[2] ? decodeURIComponent(match[2]) : null;
	},
	removeItem: (key: string): void => {
		// biome-ignore lint: intentional cookie storage adapter for cross-subdomain auth
		document.cookie = `${encodeURIComponent(key)}=; path=/; domain=.middlesexmosquito.org; max-age=0; secure; samesite=lax`;
	},
	setItem: (key: string, value: string): void => {
		const maxAge = 60 * 60 * 24 * 365;
		// biome-ignore lint: intentional cookie storage adapter for cross-subdomain auth
		document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; path=/; domain=.middlesexmosquito.org; max-age=${maxAge}; secure; samesite=lax`;
	},
};

/**
 * Creates a Supabase browser client.
 *
 * Generic so the returned client is directly assignable to SupabaseClient<any>
 * without casting (avoids TypeScript class invariance issues with protected members).
 */
export function createClient<TDatabase = Database>(
	supabaseUrl: string,
	supabaseKey: string,
) {
	return createSupabaseClient<TDatabase>(supabaseUrl, supabaseKey, {
		auth: isProduction
			? {
					flowType: "pkce",
					storage: cookieStorage,
				}
			: {},
	});
}
