import { Home, Newspaper, Shield, Users } from "lucide-react";
import type { AppRole } from "./roles";

/**
 * The four staff applications, by name.
 *
 * `activeApp` on the layout context carried a documented invariant — "must match an
 * AVAILABLE_APPS name" — and no type to hold it, which made it the one field in that context a
 * typo could quietly break. A mismatched name takes the app switcher's `activeApp` lookup to
 * nothing, and the switcher's answer to that was to render nothing at all: no mark, no name, no
 * way out of the application.
 */
export type AppName = "Admin" | "Central" | "HR" | "Website Management";

export type App = {
	name: AppName;
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

/**
 * The public website's origin.
 *
 * Not `appUrl`: the public site is the apex in production and `staging.` in staging, so it is
 * the one origin whose host is not `<name><suffix>.` — the same reason `environmentSuffix`
 * treats a bare `staging` label as the staging suffix. Staff screens that show what the public
 * sees link out to the page itself with it, and a link into the wrong environment's public
 * record is exactly the mistake `IS_DEPLOYED`/`SUFFIX` exist to prevent.
 */
export const PUBLIC_SITE_URL = IS_DEPLOYED
	? `https://${SUFFIX ? "staging." : ""}${ROOT_DOMAIN}`
	: "https://localhost:3448";

export function getCentralLoginUrl(redirect?: string): string {
	const base = `${CENTRAL_URL}/login`;
	if (redirect) {
		return `${base}?redirect=${encodeURIComponent(redirect)}`;
	}
	return base;
}

/**
 * Password recovery lives in Central only, and deliberately.
 *
 * Central is the one application every signed-in employee has, so it is the only front door that
 * cannot be a dead end. Reset mail also lands on whichever origin asked for it, so hosting the
 * request in four places would scatter the same flow across four hostnames for no gain — HR,
 * Admin and Website Management link here instead.
 */
export const CENTRAL_FORGOT_PASSWORD_URL = `${CENTRAL_URL}/forgot-password`;

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

declare const accessibleApps: unique symbol;

/**
 * A list of apps that has been through `filterAppsByPermissions`.
 *
 * The brand exists because the app switcher's one job is to not offer a door the user cannot
 * open, and for a while it did: three apps passed the filtered list and one passed
 * `AVAILABLE_APPS` straight through, so from Website Management the switcher advertised HR and
 * Admin to people without the roles for them. Both values were `App[]`, so nothing caught it.
 *
 * The layout context now demands this type, and the only way to obtain one is to call the
 * filter. The bug stops being something to remember and becomes something that does not compile.
 */
export type AccessibleApps = readonly App[] & {
	readonly [accessibleApps]: true;
};

/**
 * Filters apps based on user permissions
 * @param userPermissions Array of permission strings the user has
 * @returns Filtered list of apps the user can access
 */
export function filterAppsByPermissions(
	userPermissions: readonly string[],
): AccessibleApps {
	return AVAILABLE_APPS.filter(
		(app) =>
			app.requiredPermission === null ||
			userPermissions.includes(app.requiredPermission),
	) as unknown as AccessibleApps;
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
