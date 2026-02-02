import { ErrorMessages } from "@mcmec/lib/constants/errors";
import type { Database } from "@mcmec/supabase/database.types";
import { createServerClient } from "@supabase/ssr";
import { getCookies, setCookie } from "@tanstack/react-start/server";

export function getSupabaseServerClient() {
	const supabaseUrl = process.env.VITE_SUPABASE_URL;
	const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

	if (!supabaseUrl || !supabaseKey) {
		throw new Error(ErrorMessages.SERVER.ENVIRONMENT_MISCONFIGURED);
	}

	return createServerClient<Database>(supabaseUrl, supabaseKey, {
		cookies: {
			getAll() {
				return Object.entries(getCookies()).map(([name, value]) => ({
					name,
					value,
				}));
			},
			setAll(cookies) {
				cookies.forEach((cookie) => {
					setCookie(cookie.name, cookie.value);
				});
			},
		},
	});
}
