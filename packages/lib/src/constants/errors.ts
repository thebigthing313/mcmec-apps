export const ErrorMessages = {
	AUTH: {
		UNAUTHORIZED: "You must be logged in to access this resource.",
		FORBIDDEN: "You do not have permission to this action or resource.",
		SESSION_EXPIRED: "Your session has expired. Please log in again.",
		INVALID_JWT: "The provided authentication token is invalid.",
		UNABLE_TO_FETCH_CLAIMS: "Unable to fetch user claims. Please try again.",
		UNABLE_TO_RETRIEVE_SESSION: "Unable to retrieve session. Please try again.",
	},
	VALIDATION: {
		INVALID_EMAIL: "Please enter a valid email address.",
		INVALID_UUID: "The provided ID is not valid.",
		PASSWORD_TOO_SHORT: "Password must be at least 8 characters long.",
	},
	SERVER: {
		INTERNAL_ERROR: "An unexpected error occurred. Please try again later.",
		SERVICE_UNAVAILABLE: "The service is temporarily down.",
	},
} as const;

export type ErrorCode = typeof ErrorMessages;
