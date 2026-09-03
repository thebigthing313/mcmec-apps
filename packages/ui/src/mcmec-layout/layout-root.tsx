"use client";

import { logo512 } from "@mcmec/lib/constants/assets";
import { COMPANY_INFO } from "@mcmec/lib/constants/company";
import { SidebarProvider } from "@mcmec/ui/components/sidebar";
import type { LayoutContextData } from "@mcmec/ui/mcmec-layout/layout-context.js";
import { LayoutContextProvider } from "@mcmec/ui/mcmec-layout/layout-context.js";
import * as React from "react";
import { SkipLink } from "../blocks/skip-link";

interface LayoutRootProps {
	children: React.ReactNode;
	value: Omit<LayoutContextData, "companyLogoUrl" | "companyName">;
}

/**
 * The cookie `SidebarProvider` writes when the rail is expanded or collapsed.
 *
 * Duplicated rather than imported: the authoritative constant lives in `components/sidebar.tsx`,
 * which is generated shadcn, excluded from linting, and does not export it. If that file is ever
 * regenerated with a different name this reader stops matching and rail persistence dies with no
 * compile error — so if you regenerate the sidebar, check this string.
 */
const SIDEBAR_COOKIE_NAME = "sidebar_state";

/**
 * Reads the persisted rail state back.
 *
 * `SidebarProvider` has always written this cookie and nothing has ever read it, so collapsing the
 * rail lasted only until the next reload and someone who works collapsed re-collapsed all day.
 *
 * This restores the setting across reloads within one application, and no further: the cookie is
 * written without a `domain` attribute, so it is host-scoped, and in production the four
 * applications sit on four subdomains. A cross-origin app switch still lands on the default. See
 * the README for what making that work would cost.
 *
 * Expanded is the default when the cookie is absent or unreadable: a rail whose labels are
 * showing is the safe failure.
 */
function readPersistedSidebarState(): boolean {
	if (typeof document === "undefined") {
		return true;
	}
	const match = document.cookie.match(
		new RegExp(`(?:^|;\\s*)${SIDEBAR_COOKIE_NAME}=(true|false)`),
	);
	return match ? match[1] === "true" : true;
}

export function LayoutRoot({ children, value }: LayoutRootProps) {
	const companyLogoUrl = logo512;
	const companyName = COMPANY_INFO.shortName;
	// Read once on mount. `SidebarProvider` takes this as an initial value only, so re-reading
	// on later renders would be work that changes nothing.
	const [defaultOpen] = React.useState(readPersistedSidebarState);
	return (
		<LayoutContextProvider
			value={{
				companyLogoUrl,
				companyName,
				...value,
			}}
		>
			<SidebarProvider defaultOpen={defaultOpen}>
				{/*
				 * First focusable element on every staff screen. Without it a keyboard user
				 * tabs the sidebar trigger, the app switcher, every destination in the rail —
				 * eleven of them in Website Management — and the user menu before reaching the
				 * page, on every single navigation.
				 *
				 * Shared with the public site rather than copied: the note that used to sit
				 * here claimed the public site already had one of these, and it did not.
				 */}
				<SkipLink />
				{children}
			</SidebarProvider>
		</LayoutContextProvider>
	);
}
