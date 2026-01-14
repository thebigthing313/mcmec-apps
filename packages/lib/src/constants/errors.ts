export const ErrorMessages = {
	AUTH: {
		UNAUTHORIZED: "You must be logged in to access this resource.",
		FORBIDDEN: "You do not have permission to this action or resource.",
		SESSION_EXPIRED: "Your session has expired. Please log in again.",
		INVALID_JWT: "The provided authentication token is invalid.",
		UNABLE_TO_FETCH_CLAIMS: "Unable to fetch user claims. Please try again.",
		NOT_ONBOARDED: "User has not properly onboarded.",
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
		ENVIRONMENT_MISCONFIGURED: "The server environment is misconfigured.",
	},
	BROWSER: {
		ROOT_ELEMENT_NOT_FOUND: "Root element not found",
	},
	DATABASE: {
		UNABLE_TO_FETCH: (table: string) =>
			`Unable to fetch data from the ${table} table.`,
	},
	UI: {
		FAILED_TO_COPY: "Failed to copy to clipboard. Please try again.",
	},
} as const;

export type ErrorCode = typeof ErrorMessages;
