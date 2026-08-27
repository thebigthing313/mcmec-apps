"use client";

import { logo512 } from "@mcmec/lib/constants/assets";
import { COMPANY_INFO } from "@mcmec/lib/constants/company";
import { SidebarProvider } from "@mcmec/ui/components/sidebar";
import type { LayoutContextData } from "@mcmec/ui/mcmec-layout/layout-context.js";
import { LayoutContextProvider } from "@mcmec/ui/mcmec-layout/layout-context.js";
import * as React from "react";

interface LayoutRootProps {
	children: React.ReactNode;
	value: Omit<LayoutContextData, "companyLogoUrl" | "companyName">;
}

/** The cookie `SidebarProvider` writes when the rail is expanded or collapsed. */
const SIDEBAR_COOKIE_NAME = "sidebar_state";

/**
 * Reads the persisted rail state back.
 *
 * `SidebarProvider` has always written this cookie and nothing has ever read it, so collapsing
 * the rail lasted until the next reload and was lost on every app switch — which, since
 * switching apps is a cross-origin page load, meant it was lost constantly. Someone who works
 * collapsed had to re-collapse all day.
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
			<SidebarProvider defaultOpen={defaultOpen}>{children}</SidebarProvider>
		</LayoutContextProvider>
	);
}
