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

export class NoEmployeeError extends AuthError {
	constructor(message: string = ErrorMessages.AUTH.NO_EMPLOYEE) {
		super(message, "NO_EMPLOYEE");
		this.name = "NoEmployeeError";
	}
}
