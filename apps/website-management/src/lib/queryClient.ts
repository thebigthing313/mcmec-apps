import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { createClient } from "@mcmec/supabase/client";
import { QueryClient } from "@tanstack/react-query";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
	throw new Error(ErrorMessages.SERVER.ENVIRONMENT_MISCONFIGURED);
}

export const supabase = createClient(supabaseUrl, supabaseKey);
export const queryClient = new QueryClient();
