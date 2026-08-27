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
			<SidebarProvider defaultOpen={defaultOpen}>
				{/*
				 * First focusable element on every staff screen.
				 *
				 * Without it a keyboard user tabs the sidebar trigger, the app switcher, every
				 * destination in the rail — eleven of them in Website Management — and the user menu
				 * before reaching the page, on every single navigation. The public site has had one
				 * of these all along; the staff applications, which people use all day, did not.
				 *
				 * Hidden until focused, then drawn as a real control rather than a ghost: someone
				 * who tabs into it needs to see where the focus went.
				 */}
				<a
					className="absolute top-0 left-0 z-50 -translate-y-full rounded-b-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-transform focus:translate-y-0"
					href="#main-content"
				>
					Skip to main content
				</a>
				{children}
			</SidebarProvider>
		</LayoutContextProvider>
	);
}
