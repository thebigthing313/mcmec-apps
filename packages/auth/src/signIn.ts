import { ErrorMessages } from "@mcmec/lib/constants/errors";
import {
	PasswordSchema,
	ValidEmailSchema,
} from "@mcmec/lib/constants/validators";
import z from "zod";
import { UnauthenticatedError } from "./errors";
import type { SupabaseClient } from "./types";

const SignInInputSchema = z.object({
	email: ValidEmailSchema,
	password: PasswordSchema,
});

export const signIn = async (input: {
	email: string;
	password: string;
	client: SupabaseClient;
}): Promise<void> => {
	const validatedInput = SignInInputSchema.parse({
		email: input.email,
		password: input.password,
	});

	const { data, error } = await input.client.auth.signInWithPassword({
		email: validatedInput.email,
		password: validatedInput.password,
	});

	if (error) {
		throw new UnauthenticatedError(ErrorMessages.AUTH.UNAUTHORIZED);
	}

	if (!data.user || !data.session) {
		throw new UnauthenticatedError(ErrorMessages.AUTH.UNAUTHORIZED);
	}
};
