import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { createClient } from "../client/server";

const SessionSchema = z.object({
	userId: z.string().uuid(ErrorMessages.VALIDATION.INVALID_UUID),
	userEmail: z.string().email(ErrorMessages.VALIDATION.INVALID_EMAIL),
	expiresAt: z.number(),
});

export type SessionData = z.infer<typeof SessionSchema>;

/**
 * Server function to validate the current user session.
 * Throws an error if no valid session exists.
 * Use this in TanStack Router's beforeLoad to protect routes.
 */
export const checkSessionFn = createServerFn({ method: "GET" })
	.inputValidator((d: { supabaseUrl: string; supabaseKey: string }) => d)
	.handler(async ({ data }) => {
		return checkSessionLogic(data);
	});

/**
 * Core logic to check for a valid session.
 * Can be reused directly in server contexts.
 */
export const checkSessionLogic = async (input: {
	supabaseUrl: string;
	supabaseKey: string;
}) => {
	const { supabaseUrl, supabaseKey } = input;

	const supabase = createClient(supabaseUrl, supabaseKey);

	// Get the current session
	const {
		data: { session },
		error,
	} = await supabase.auth.getSession();

	if (error) {
		throw new Error(ErrorMessages.AUTH.UNABLE_TO_RETRIEVE_SESSION);
	}

	if (!session) {
		throw new Error(ErrorMessages.AUTH.UNAUTHORIZED);
	}

	// Validate session data
	const sessionData: SessionData = {
		userId: session.user.id,
		userEmail: session.user.email ?? "",
		expiresAt: session.expires_at ?? 0,
	};

	const validatedSession = SessionSchema.parse(sessionData);

	// Check if session is expired
	const now = Math.floor(Date.now() / 1000);
	if (validatedSession.expiresAt <= now) {
		throw new Error(ErrorMessages.AUTH.SESSION_EXPIRED);
	}

	return validatedSession;
};
