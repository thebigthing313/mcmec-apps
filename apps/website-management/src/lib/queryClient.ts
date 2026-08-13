import { makeAuthClient } from "@mcmec/auth/client";
import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { QueryClient } from "@tanstack/react-query";

// API origin (Railway backend). Local dev points at the local api (localhost:3005), which
// proxies Electric reads + serves Better Auth / the data write path against staging.
const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
	throw new Error(ErrorMessages.SERVER.ENVIRONMENT_MISCONFIGURED);
}

export const API_URL: string = apiUrl;

// Better Auth browser client — carries the shared session cookie (credentials: "include").
export const authClient = makeAuthClient(apiUrl);
export const queryClient = new QueryClient();
