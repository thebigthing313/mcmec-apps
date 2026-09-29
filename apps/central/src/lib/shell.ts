/**
 * What the shell needs from an App's layout route, carried in `staticData`.
 *
 * The root signed-in layout renders the one shell (frame, switcher, NavUser, breadcrumb). An App
 * contributes only its name and its rail, declared on its layout route:
 *
 *   staticData: { activeApp: "HR", sidebar: HR_SIDEBAR },
 *   beforeLoad: ({ context }) => requireAppRole(context.claims, "manage_employees"),
 *
 * The shell reads the deepest match that declares an `activeApp`. The Self Service Portal
 * declares its own on the root signed-in layout, so it is what every other App overrides.
 */
import { ForbiddenError } from "@mcmec/auth/errors";
import type { AppName } from "@mcmec/lib/constants/apps";
import type { LayoutNavGroup } from "@mcmec/ui/mcmec-layout";

export type AppSidebar = Array<LayoutNavGroup<{ to: string }>>;

declare module "@tanstack/react-router" {
	interface StaticDataRouteOption {
		/** The App this route and its children belong to. Typed so a typo does not compile. */
		activeApp?: AppName;
		/** That App's rail. Declared alongside `activeApp`, on the App's layout route. */
		sidebar?: AppSidebar;
	}
}

type ShellMatch = {
	status: string;
	error?: unknown;
	staticData: { activeApp?: AppName; sidebar?: AppSidebar };
};

export type ShellApp = { activeApp: AppName; sidebar: AppSidebar };

/**
 * The App the shell presents for the current matches: the deepest one that declares itself,
 * stopping at an App that refused the User. A refused App keeps its URL but not its rail, so
 * the shell falls back to the App above it — the Self Service Portal.
 */
export function shellAppOf(
	matches: readonly ShellMatch[],
	fallback: ShellApp,
): ShellApp {
	let shell = fallback;
	for (const match of matches) {
		if (match.status === "error" && match.error instanceof ForbiddenError) {
			break;
		}
		const { activeApp, sidebar } = match.staticData;
		if (activeApp) {
			shell = { activeApp, sidebar: sidebar ?? [] };
		}
	}
	return shell;
}
