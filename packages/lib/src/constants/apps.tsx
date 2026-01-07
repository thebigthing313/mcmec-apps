import { Newspaper } from "lucide-react";

export type App = {
	name: string;
	logo: React.ReactNode;
	description: string;
	href: string;
	requiredPermission: string | null;
};

export const AVAILABLE_APPS: App[] = [
	{
		name: "Public Notices",
		logo: <Newspaper />,
		description: "Manage and publish public notices for the agency.",
		href: "notices",
		requiredPermission: "public_notices",
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
