import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { createClient } from "@mcmec/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { QueryClient } from "@tanstack/react-query";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
	throw new Error(ErrorMessages.SERVER.ENVIRONMENT_MISCONFIGURED);
}

const client = createClient(supabaseUrl, supabaseKey);

/** Typed client for auth and direct queries */
export const supabase = client;

/** Untyped client for the integration package (class variance workaround) */
export const supabaseUntyped = client as unknown as SupabaseClient;

export const queryClient = new QueryClient();
