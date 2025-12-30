"use client";

import type { App } from "@mcmec/lib/constants/apps";
import { SidebarProvider } from "@mcmec/ui/components/sidebar";
import { LayoutContextProvider } from "@mcmec/ui/mcmec-layout/layout-context.js";
import { LayoutErrorBoundary } from "@mcmec/ui/mcmec-layout/layout-error-boundary";
import type * as React from "react";

interface LayoutProviderProps {
	children: React.ReactNode;
	companyLogoUrl: string;
	companyName: string;
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
	companyLogoUrl,
	companyName,
	apps,
	activeApp,
	user,
	onLogout,
}: LayoutProviderProps) {
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
