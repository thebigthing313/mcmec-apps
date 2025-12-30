import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../database.types";

export type SupabaseBrowserClient = ReturnType<
	typeof createBrowserClient<Database>
>;

export function createClient(
	supabaseUrl: string,
	supabaseKey: string,
): SupabaseBrowserClient {
	return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}
