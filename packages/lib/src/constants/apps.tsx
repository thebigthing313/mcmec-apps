import { Home, Newspaper, Shield, Users } from "lucide-react";
import type { AppRole } from "./roles";

export type App = {
	name: string;
	logo: React.ReactNode;
	description: string;
	href: string;
	requiredPermission: AppRole | null;
};

const ROOT_DOMAIN = "middlesexmosquito.org";

/**
 * The environment's subdomain suffix: `""` in production, `"-staging"` on staging.
 *
 * Staging hosts are siblings of production under the same parent domain
 * (`hr-staging.middlesexmosquito.org` beside `hr.middlesexmosquito.org`) because the SSO
 * cookie is scoped to that shared parent and can't span two unrelated domains. So the
 * environment is readable off the current hostname: take the label immediately left of the
 * root domain and see whether it carries the suffix.
 *
 * This is derived rather than configured on purpose. A build-time `VITE_ENV` flag would have
 * to be set correctly on every frontend service, and a service missing it would silently link
 * staging users into production — the exact failure this replaces.
 */
function environmentSuffix(hostname: string): string {
	if (hostname !== ROOT_DOMAIN && !hostname.endsWith(`.${ROOT_DOMAIN}`)) {
		return "";
	}
	// "" on the apex, "hr" in production, "hr-staging" on staging, "staging" for the public site.
	const label =
		hostname.slice(0, -`.${ROOT_DOMAIN}`.length).split(".").pop() ?? "";
	return label === "staging" || label.endsWith("-staging") ? "-staging" : "";
}

const HOSTNAME = typeof window !== "undefined" ? window.location.hostname : "";

const IS_DEPLOYED =
	HOSTNAME === ROOT_DOMAIN || HOSTNAME.endsWith(`.${ROOT_DOMAIN}`);

const SUFFIX = environmentSuffix(HOSTNAME);

/**
 * `devPort` is the app's **Caddy** port, not its Vite port. Both the scheme and the port
 * matter: an `http://` page calling the `https://` API is cross-site under schemeful
 * same-site, so the session cookie is withheld and the app bounces straight to `/login`.
 * Linking at the Vite upstream would hand every switcher click that dead end.
 */
function appUrl(subdomain: string, devPort: number): string {
	return IS_DEPLOYED
		? `https://${subdomain}${SUFFIX}.${ROOT_DOMAIN}`
		: `https://localhost:${devPort}`;
}

export const CENTRAL_URL = appUrl("central", 3444);

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
		href: appUrl("central", 3444),
		logo: <Home />,
		name: "Central",
		requiredPermission: null,
	},
	{
		description: "Manage the content published on the public website.",
		// "website-management", not "website": the subdomain has to match the host actually
		// provisioned on Railway in BOTH environments — `website-management` in production and
		// `website-management-staging` in staging, the latter of which the `-staging` suffix is
		// appended to. "website" resolved in neither.
		href: appUrl("website-management", 3447),
		logo: <Newspaper />,
		name: "Website Management",
		requiredPermission: "manage_website",
	},
	{
		description: "Manage employees and user accounts.",
		href: appUrl("hr", 3445),
		logo: <Users />,
		name: "HR",
		requiredPermission: "manage_employees",
	},
	{
		description: "Manage user permission assignments.",
		href: appUrl("admin", 3446),
		logo: <Shield />,
		name: "Admin",
		requiredPermission: "manage_users",
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
