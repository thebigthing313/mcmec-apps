import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { createClient } from "../client";

export const signOut = async (input: {
	supabaseUrl: string;
	supabaseKey: string;
}) => {
	const supabase = createClient(input.supabaseUrl, input.supabaseKey);

	const { error } = await supabase.auth.signOut();

	if (error) {
		throw new Error(ErrorMessages.AUTH.UNAUTHORIZED);
	}

	return { success: true };
};
