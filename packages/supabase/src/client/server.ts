import { createServerClient } from "@supabase/ssr";
import { getCookies, setCookie } from "@tanstack/react-start/server";
import type { Database } from "../database.types";

export type SupabaseServerClient = ReturnType<
	typeof createServerClient<Database>
>;
export function createClient(
	supabaseUrl: string,
	supabaseKey: string,
): SupabaseServerClient {
	return createServerClient<Database>(supabaseUrl, supabaseKey, {
		cookies: {
			getAll() {
				return Object.entries(getCookies()).map(
					([name, value]) =>
						({
							name,
							value,
						}) as { name: string; value: string },
				);
			},
			setAll(cookies) {
				cookies.forEach((cookie) => {
					setCookie(cookie.name, cookie.value);
				});
			},
		},
	});
}
