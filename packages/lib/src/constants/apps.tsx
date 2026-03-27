import { Home, Newspaper, Shield, Users } from "lucide-react";

export type App = {
	name: string;
	logo: React.ReactNode;
	description: string;
	href: string;
	requiredPermission: string | null;
};

const DOMAIN =
	typeof window !== "undefined" &&
	window.location.hostname.includes("middlesexmosquito.org")
		? "middlesexmosquito.org"
		: "localhost";

const isProduction = DOMAIN === "middlesexmosquito.org";

function appUrl(subdomain: string, port: number): string {
	return isProduction
		? `https://${subdomain}.${DOMAIN}`
		: `http://localhost:${port}`;
}

export const CENTRAL_URL = appUrl("central", 3001);

export function getCentralLoginUrl(redirect?: string): string {
	const base = `${CENTRAL_URL}/login`;
	if (redirect) {
		return `${base}?redirect=${encodeURIComponent(redirect)}`;
	}
	return base;
}

export const AVAILABLE_APPS: App[] = [
	{
		description: "Employee self-service portal.",
		href: appUrl("central", 3001),
		logo: <Home />,
		name: "Central",
		requiredPermission: null,
	},
	{
		description: "Manage and publish public notices for the agency.",
		href: appUrl("notices", 3002),
		logo: <Newspaper />,
		name: "Public Notices",
		requiredPermission: "public_notices",
	},
	{
		description: "Manage employees and user accounts.",
		href: appUrl("hr", 3003),
		logo: <Users />,
		name: "HR",
		requiredPermission: "manage_employees",
	},
	{
		description: "Manage user permission assignments.",
		href: appUrl("admin", 3004),
		logo: <Shield />,
		name: "Admin",
		requiredPermission: "admin_rights",
	},
];

/**
 * Filters apps based on user permissions
 * @param userPermissions Array of permission strings the user has
 * @returns Filtered list of apps the user can access
 */
export function filterAppsByPermissions(userPermissions: string[]): App[] {
	return AVAILABLE_APPS.filter(
		(app) =>
			app.requiredPermission === null ||
			userPermissions.includes(app.requiredPermission),
	);
}

/**
 * Checks if a user has access to a specific app
 * @param appName The name of the app
 * @param userPermissions Array of permission strings the user has
 * @returns Boolean indicating if user has access
 */
export function hasAppAccess(
	appName: string,
	userPermissions: string[],
): boolean {
	const app = AVAILABLE_APPS.find((a) => a.name === appName);
	if (!app) return false;
	return (
		app.requiredPermission === null ||
		userPermissions.includes(app.requiredPermission)
	);
}
