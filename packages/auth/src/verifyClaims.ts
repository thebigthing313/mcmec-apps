import { ErrorMessages } from "@mcmec/lib/constants/errors";
import z from "zod";
import type { AuthClient } from "./client";
import {
	ForbiddenError,
	NotOnboardedError,
	UnauthenticatedError,
} from "./errors";
import type { Claims, SessionData } from "./types";

const ClaimsSchema = z.object({
	userId: z.uuid(ErrorMessages.VALIDATION.INVALID_UUID),
	userEmail: z.email(ErrorMessages.VALIDATION.INVALID_EMAIL),
	employeeId: z.uuid(ErrorMessages.VALIDATION.INVALID_UUID).nullable(),
	permissions: z.array(z.string()),
});

/**
 * Resolves the current Better Auth session into our `Claims` shape.
 *
 * Reads `GET /api/auth/get-session` via the client (cookie-authenticated), then maps
 * the `customSession` fields. Mirrors the old Supabase-JWT `verifyClaims` semantics:
 *   - no session / fetch error  -> UnauthenticatedError
 *   - session but no employeeId  -> NotOnboardedError
 *   - required permission absent -> ForbiddenError
 */
export const verifyClaims = async (input: {
	client: AuthClient;
	permission?: string;
}): Promise<Claims> => {
	const { client, permission } = input;
	const { data, error } = await client.getSession();

	if (error) {
		throw new UnauthenticatedError(ErrorMessages.AUTH.UNABLE_TO_FETCH_CLAIMS);
	}
	if (!data) {
		throw new UnauthenticatedError(ErrorMessages.AUTH.INVALID_JWT);
	}

	// The base client types getSession() without our customSession fields; cast to the
	// server-projected shape (see SessionData) rather than couple to `apps/api`'s `auth`.
	const session = data as unknown as SessionData;

	const returnedClaims = {
		userId: session.user?.id,
		userEmail: session.user?.email,
		employeeId:
			typeof session.employeeId === "string" ? session.employeeId : null,
		permissions: Array.isArray(session.permissions) ? session.permissions : [],
	};

	const parsedClaims = ClaimsSchema.parse(returnedClaims);

	if (!parsedClaims.employeeId) {
		throw new NotOnboardedError();
	}

	if (permission && !parsedClaims.permissions.includes(permission)) {
		throw new ForbiddenError();
	}

	return parsedClaims;
};
