import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "../client/server";

export const signOutFn = createServerFn({ method: "POST" })
	.inputValidator((d: { supabaseUrl: string; supabaseKey: string }) => d)
	.handler(async ({ data }) => {
		return signOutLogic(data);
	});

export const signOutLogic = async (input: {
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
