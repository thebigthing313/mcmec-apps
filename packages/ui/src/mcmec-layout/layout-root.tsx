"use client";

import { COMPANY_INFO } from "@mcmec/lib/constants/company";
import { SidebarProvider } from "@mcmec/ui/components/sidebar";
import type { LayoutContextData } from "@mcmec/ui/mcmec-layout/layout-context.js";
import { LayoutContextProvider } from "@mcmec/ui/mcmec-layout/layout-context.js";
import type * as React from "react";

interface LayoutRootProps {
	children: React.ReactNode;
	value: Omit<LayoutContextData, "companyLogoUrl" | "companyName">;
}

export function LayoutRoot({ children, value }: LayoutRootProps) {
	const companyLogoUrl = "logo512.png";
	const companyName = COMPANY_INFO.shortName;
	return (
		<LayoutContextProvider
			value={{
				companyLogoUrl,
				companyName,
				...value,
			}}
		>
			<SidebarProvider>{children}</SidebarProvider>
		</LayoutContextProvider>
	);
}
