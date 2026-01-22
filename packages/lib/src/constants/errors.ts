export const ErrorMessages = {
	AUTH: {
		FORBIDDEN: "You do not have permission to this action or resource.",
		INVALID_JWT: "The provided authentication token is invalid.",
		NOT_ONBOARDED: "User has not properly onboarded.",
		SESSION_EXPIRED: "Your session has expired. Please log in again.",
		UNABLE_TO_FETCH_CLAIMS: "Unable to fetch user claims. Please try again.",
		UNABLE_TO_RETRIEVE_SESSION: "Unable to retrieve session. Please try again.",
		UNAUTHORIZED: "You must be logged in to access this resource.",
	},
	BROWSER: {
		ROOT_ELEMENT_NOT_FOUND: "Root element not found",
	},
	DATABASE: {
		RECORD_NOT_AVAILABLE: "The requested record is not available.",
		UNABLE_TO_DELETE: (table: string, dbError?: string) =>
			`Unable to delete data from the ${table} table.${dbError ? ` Error: ${dbError}` : ""}`,
		UNABLE_TO_FETCH: (table: string, dbError?: string) =>
			`Unable to fetch data from the ${table} table.${dbError ? ` Error: ${dbError}` : ""}`,
		UNABLE_TO_INSERT: (table: string, dbError?: string) =>
			`Unable to insert data into the ${table} table.${dbError ? ` Error: ${dbError}` : ""}`,
		UNABLE_TO_UPDATE: (table: string, dbError?: string) =>
			`Unable to update data in the ${table} table.${dbError ? ` Error: ${dbError}` : ""}`,
	},
	SERVER: {
		ENVIRONMENT_MISCONFIGURED: "The server environment is misconfigured.",
		INTERNAL_ERROR: "An unexpected error occurred. Please try again later.",
		SERVICE_UNAVAILABLE: "The service is temporarily down.",
	},
	UI: {
		FAILED_TO_COPY: "Failed to copy to clipboard. Please try again.",
	},
	VALIDATION: {
		INVALID_EMAIL: "Please enter a valid email address.",
		INVALID_UUID: "The provided ID is not valid.",
		PASSWORD_TOO_SHORT: "Password must be at least 8 characters long.",
	},
} as const;

export type ErrorCode = typeof ErrorMessages;
