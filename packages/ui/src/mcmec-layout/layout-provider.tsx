"use client";

import type { App } from "@mcmec/lib/constants/apps";
import { ASSET_URLS } from "@mcmec/lib/constants/assets";
import { COMPANY_INFO } from "@mcmec/lib/constants/company";
import { SidebarProvider } from "@mcmec/ui/components/sidebar";
import { LayoutContextProvider } from "@mcmec/ui/mcmec-layout/layout-context.js";
import { LayoutErrorBoundary } from "@mcmec/ui/mcmec-layout/layout-error-boundary";
import type * as React from "react";

interface LayoutProviderProps {
	children: React.ReactNode;
	apps: Array<App>;
	activeApp: string;
	user: {
		name: string;
		title: string;
		avatar: string;
	};
	onLogout?: () => void;
}

export function LayoutProvider({
	children,
	apps,
	activeApp,
	user,
	onLogout,
}: LayoutProviderProps) {
	const companyLogoUrl = ASSET_URLS.logo;
	const companyName = COMPANY_INFO.name;
	return (
		<LayoutErrorBoundary>
			<LayoutContextProvider
				value={{
					companyLogoUrl,
					companyName,
					apps,
					activeApp,
					user,
					onLogout,
				}}
			>
				<SidebarProvider>{children}</SidebarProvider>
			</LayoutContextProvider>
		</LayoutErrorBoundary>
	);
}
