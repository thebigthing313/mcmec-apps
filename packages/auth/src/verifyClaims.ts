import { ErrorMessages } from "@mcmec/lib/constants/errors";
import z from "zod";
import {
	ForbiddenError,
	NotOnboardedError,
	UnauthenticatedError,
} from "./errors";
import type { Claims, SupabaseClient } from "./types";

interface JwtClaims {
	iss: string;
	aud: string | string[];
	exp: number;
	iat: number;
	sub: string;
	role: string;
	aal: "aal1" | "aal2";
	session_id: string;
	email: string;
	phone: string;
	is_anonymous: boolean;
	jti?: string;
	nbf?: number;
	app_metadata?: Record<string, unknown>;
	user_metadata?: Record<string, unknown>;
	amr?: Array<{
		method: string;
		timestamp: number;
	}>;
	ref?: string;
}

const ClaimsSchema = z.object({
	userId: z.uuid(ErrorMessages.VALIDATION.INVALID_UUID),
	userEmail: z.email(ErrorMessages.VALIDATION.INVALID_EMAIL),
	profileId: z.uuid(ErrorMessages.VALIDATION.INVALID_UUID).nullable(),
	employeeId: z.uuid(ErrorMessages.VALIDATION.INVALID_UUID).nullable(),
	permissions: z.array(z.string()),
});

export const verifyClaims = async (input: {
	client: SupabaseClient;
	permission?: string;
}): Promise<Claims> => {
	const { client, permission } = input;
	const { data: claimsData, error } = await client.auth.getClaims();

	if (error) {
		throw new UnauthenticatedError(ErrorMessages.AUTH.UNABLE_TO_FETCH_CLAIMS);
	}
	if (!claimsData) {
		throw new UnauthenticatedError(ErrorMessages.AUTH.INVALID_JWT);
	}

	const claims = claimsData.claims as JwtClaims;
	const appMeta =
		typeof claims.app_metadata === "object" && claims.app_metadata !== null
			? (claims.app_metadata as Record<string, unknown>)
			: ({} as Record<string, unknown>);

	const returnedClaims = {
		userId: claims.sub,
		userEmail: claims.email,
		profileId:
			typeof appMeta.profile_id === "string" ? appMeta.profile_id : null,
		employeeId:
			typeof appMeta.employee_id === "string" ? appMeta.employee_id : null,
		permissions: Array.isArray(appMeta.permissions)
			? (appMeta.permissions as Array<string>)
			: [],
	};

	const parsedClaims = ClaimsSchema.parse(returnedClaims);

	if (!parsedClaims.profileId) {
		throw new NotOnboardedError();
	}

	if (permission && !parsedClaims.permissions.includes(permission)) {
		throw new ForbiddenError();
	}

	return parsedClaims;
};
