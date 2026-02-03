import { ErrorMessages } from "@mcmec/lib/constants/errors";
import type { Database } from "@mcmec/supabase/database.types";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export function getSupabaseServiceClient(): SupabaseClient<Database> {
	const supabaseUrl = process.env.VITE_SUPABASE_URL;
	const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!supabaseUrl || !supabaseServiceRoleKey) {
		throw new Error(ErrorMessages.SERVER.ENVIRONMENT_MISCONFIGURED);
	}

	//@ts-expect-error TS2345 Supabase types are not correctly inferred here
	return createServerClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
		cookies: {
			getAll() {
				return [];
			},
			setAll() {
				// No-op for service role client
			},
		},
	});
}
