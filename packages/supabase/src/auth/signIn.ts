import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { createClient } from "../client/server";

const SignInInputSchema = z.object({
	email: z.string().email(ErrorMessages.VALIDATION.INVALID_EMAIL),
	password: z.string().min(8, ErrorMessages.VALIDATION.PASSWORD_TOO_SHORT),
});

const SignInResponseSchema = z.object({
	userId: z.string().uuid(ErrorMessages.VALIDATION.INVALID_UUID),
	email: z.string().email(ErrorMessages.VALIDATION.INVALID_EMAIL),
	accessToken: z.string(),
	refreshToken: z.string(),
});

export type SignInInput = z.infer<typeof SignInInputSchema>;
export type SignInResponse = z.infer<typeof SignInResponseSchema>;

export const signInFn = createServerFn({ method: "POST" })
	.inputValidator(
		(d: SignInInput & { supabaseUrl: string; supabaseKey: string }) => d,
	)
	.handler(async ({ data }) => {
		return signInLogic(data);
	});

export const signInLogic = async (input: {
	email: string;
	password: string;
	supabaseUrl: string;
	supabaseKey: string;
}) => {
	// Validate input
	const validatedInput = SignInInputSchema.parse({
		email: input.email,
		password: input.password,
	});

	const supabase = createClient(input.supabaseUrl, input.supabaseKey);

	const { data, error } = await supabase.auth.signInWithPassword({
		email: validatedInput.email,
		password: validatedInput.password,
	});

	if (error) {
		throw new Error(ErrorMessages.AUTH.UNAUTHORIZED);
	}

	if (!data.user || !data.session) {
		throw new Error(ErrorMessages.AUTH.UNAUTHORIZED);
	}

	const response = {
		userId: data.user.id,
		email: data.user.email ?? "",
		accessToken: data.session.access_token,
		refreshToken: data.session.refresh_token,
	};

	// Validate response structure
	return SignInResponseSchema.parse(response);
};
