import { ErrorMessages } from "@mcmec/lib/constants/errors";

export class AuthError extends Error {
	readonly code: string;

	constructor(message: string, code: string) {
		super(message);
		this.name = "AuthError";
		this.code = code;
	}
}

export class UnauthenticatedError extends AuthError {
	constructor(message: string = ErrorMessages.AUTH.UNAUTHORIZED) {
		super(message, "UNAUTHENTICATED");
		this.name = "UnauthenticatedError";
	}
}

export class ForbiddenError extends AuthError {
	constructor(message: string = ErrorMessages.AUTH.FORBIDDEN) {
		super(message, "FORBIDDEN");
		this.name = "ForbiddenError";
	}
}

export class NotOnboardedError extends AuthError {
	constructor(message: string = ErrorMessages.AUTH.NOT_ONBOARDED) {
		super(message, "NOT_ONBOARDED");
		this.name = "NotOnboardedError";
	}
}
