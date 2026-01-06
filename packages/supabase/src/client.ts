import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type SupabaseClient = ReturnType<typeof createSupabaseClient<Database>>;

export function createClient(
	supabaseUrl: string,
	supabaseKey: string,
): SupabaseClient {
	return createSupabaseClient<Database>(supabaseUrl, supabaseKey, {});
}
