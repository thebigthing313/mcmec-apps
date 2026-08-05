import { ErrorMessages } from "@mcmec/lib/constants/errors";
import {
	PasswordSchema,
	ValidEmailSchema,
} from "@mcmec/lib/constants/validators";
import z from "zod";
import type { AuthClient } from "./client";
import { UnauthenticatedError } from "./errors";

const SignInInputSchema = z.object({
	email: ValidEmailSchema,
	password: PasswordSchema,
});

export const signIn = async (input: {
	email: string;
	password: string;
	client: AuthClient;
}): Promise<void> => {
	const validatedInput = SignInInputSchema.parse({
		email: input.email,
		password: input.password,
	});

	const { data, error } = await input.client.signIn.email({
		email: validatedInput.email,
		password: validatedInput.password,
	});

	if (error || !data) {
		throw new UnauthenticatedError(ErrorMessages.AUTH.UNAUTHORIZED);
	}
};
