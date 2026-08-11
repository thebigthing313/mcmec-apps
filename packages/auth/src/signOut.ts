import type { AuthClient } from "./client";
import { UnauthenticatedError } from "./errors";

export const signOut = async (input: { client: AuthClient }): Promise<void> => {
	const { error } = await input.client.signOut();

	if (error) {
		throw new UnauthenticatedError();
	}
};
