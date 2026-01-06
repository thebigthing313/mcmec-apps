import { ErrorMessages } from "@mcmec/lib/constants/errors";
import z from "zod";
import type { SupabaseClient } from "../client";

const SessionSchema = z.object({
	userId: z.string().uuid(ErrorMessages.VALIDATION.INVALID_UUID),
	userEmail: z.string().email(ErrorMessages.VALIDATION.INVALID_EMAIL),
	expiresAt: z.number(),
});

export type SessionData = z.infer<typeof SessionSchema>;

/**
 * Validates the current user session.
 * Throws an error if no valid session exists.
 */
export const checkSession = async (input: { client: SupabaseClient }) => {
	const { client } = input;

	// Get the current session
	const {
		data: { session },
		error,
	} = await client.auth.getSession();

	if (error) {
		throw new Error(ErrorMessages.AUTH.UNABLE_TO_RETRIEVE_SESSION);
	}

	if (!session) return null;

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
