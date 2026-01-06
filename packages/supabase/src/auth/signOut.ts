import { ErrorMessages } from "@mcmec/lib/constants/errors";
import type { SupabaseClient } from "../client";

export const signOut = async (input: { client: SupabaseClient }) => {
	const { error } = await input.client.auth.signOut();

	if (error) {
		throw new Error(ErrorMessages.AUTH.UNAUTHORIZED);
	}

	return { success: true };
};
