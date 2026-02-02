import { ErrorMessages } from "@mcmec/lib/constants/errors";
import type { Database } from "@mcmec/supabase/database.types";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCookies, setCookie } from "@tanstack/react-start/server";

export function getSupabaseServerClient(): SupabaseClient<Database> {
	const supabaseUrl = process.env.VITE_SUPABASE_URL;
	const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

	if (!supabaseUrl || !supabaseKey) {
		throw new Error(ErrorMessages.SERVER.ENVIRONMENT_MISCONFIGURED);
	}

	//@ts-expect-error TS2345 Supabase types are not correctly inferred here
	return createServerClient<Database>(supabaseUrl, supabaseKey, {
		cookies: {
			getAll() {
				return Object.entries(getCookies()).map(([name, value]) => ({
					name,
					value,
				}));
			},
			//@ts-expect-error TS2322 Type mismatch in setAll method, but this is how TS Start/Supabase documentation shows how to do it.
			setAll(cookies) {
				//@ts-expect-error TS2322 Type mismatch in setAll method, but this is how TS Start/Supabase documentation shows how to do it.
				cookies.forEach((cookie) => {
					setCookie(cookie.name, cookie.value);
				});
			},
		},
	});
}
