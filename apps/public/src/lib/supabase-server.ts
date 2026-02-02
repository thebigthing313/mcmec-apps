import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { createServerClient } from "@supabase/ssr";
import { getCookies, setCookie } from "@tanstack/react-start/server";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
	throw new Error(ErrorMessages.SERVER.ENVIRONMENT_MISCONFIGURED);
}

export function getSupabaseServerClient() {
	return createServerClient(supabaseUrl, supabaseKey, {
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
