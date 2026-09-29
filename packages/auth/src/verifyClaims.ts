import { ErrorMessages } from "@mcmec/lib/constants/errors";
import z from "zod";
import type { AuthClient } from "./client";
import {
	ForbiddenError,
	NoEmployeeError,
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
 * Reads the current Better Auth session into our `Claims` shape, and applies no policy.
 *
 * Reads `GET /api/auth/get-session` via the client (cookie-authenticated), then maps the
 * `customSession` fields. The only refusal here is having no session at all
 * (`UnauthenticatedError`). A User with no linked Employee comes back with `employeeId: null`
 * for the caller to decide about: `central` refuses that case at its root with its own gate.
 */
export const readClaims = async (input: {
	client: AuthClient;
}): Promise<Claims> => {
	const { data, error } = await input.client.getSession();

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

	return ClaimsSchema.parse(returnedClaims);
};

/**
 * `readClaims` plus the policy the single-purpose staff apps share. Mirrors the old
 * Supabase-JWT `verifyClaims` semantics:
 *   - no session / fetch error  -> UnauthenticatedError
 *   - session but no employeeId  -> NoEmployeeError
 *   - required permission absent -> ForbiddenError
 */
export const verifyClaims = async (input: {
	client: AuthClient;
	permission?: string;
}): Promise<Claims> => {
	const { client, permission } = input;
	const parsedClaims = await readClaims({ client });

	if (!parsedClaims.employeeId) {
		throw new NoEmployeeError();
	}

	if (permission && !parsedClaims.permissions.includes(permission)) {
		throw new ForbiddenError();
	}

	return parsedClaims;
};
