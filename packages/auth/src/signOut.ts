import { UnauthenticatedError } from "./errors";
import type { SupabaseClient } from "./types";

export const signOut = async (input: {
	client: SupabaseClient;
}): Promise<void> => {
	const { error } = await input.client.auth.signOut();

	if (error) {
		throw new UnauthenticatedError();
	}
};
