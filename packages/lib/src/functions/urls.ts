/**
 * URL building utilities for cross-subdomain navigation
 * Handles both local development and production environments
 */

const isDevelopment = () => {
	return (
		typeof window !== "undefined" &&
		(window.location.hostname.includes("local.test") ||
			window.location.hostname === "localhost")
	);
};

const getBaseUrl = (subdomain: string): string => {
	if (typeof window === "undefined") {
		// Server-side: return a relative URL or use environment variables
		return `http://${subdomain}.local.test:8080`;
	}

	const hostname = window.location.hostname;
	const protocol = window.location.protocol;
	const port = window.location.port;

	if (isDevelopment()) {
		// Local development using Caddyfile setup
		return `${protocol}//${subdomain}.local.test${port ? `:${port}` : ""}`;
	}

	// Production: assume standard subdomain structure
	// e.g., login.example.com, central.example.com
	const domainParts = hostname.split(".");
	if (domainParts.length >= 2) {
		// Replace first subdomain or add it
		const baseDomain = domainParts.slice(-2).join(".");
		return `${protocol}//${subdomain}.${baseDomain}`;
	}

	// Fallback
	return `${protocol}//${subdomain}.${hostname}`;
};

/**
 * Build URL for the login app
 * @param redirectTo Optional URL to redirect to after login
 */
export const buildLoginUrl = (redirectTo?: string): string => {
	const baseUrl = getBaseUrl("login");
	if (redirectTo) {
		const params = new URLSearchParams({ redirect: redirectTo });
		return `${baseUrl}?${params.toString()}`;
	}
	return baseUrl;
};

/**
 * Build URL for the central app
 * @param path Optional path within central app
 */
export const buildCentralUrl = (path?: string): string => {
	const baseUrl = getBaseUrl("central");
	return path ? `${baseUrl}${path}` : baseUrl;
};

/**
 * Get the current full URL
 */
export const getCurrentUrl = (): string => {
	if (typeof window === "undefined") {
		return "";
	}
	return window.location.href;
};

/**
 * Extract redirect parameter from URL search params
 */
export const getRedirectParam = (): string | null => {
	if (typeof window === "undefined") {
		return null;
	}
	const params = new URLSearchParams(window.location.search);
	return params.get("redirect");
};
