"use client";

import type { App } from "@mcmec/lib/constants/apps";
import * as React from "react";

export interface LayoutContextData {
	companyLogoUrl: string;
	companyName: string;
	apps: Array<App>;
	activeApp: string;
	user: {
		name: string;
		title: string;
		avatar: string;
	};
}

const LayoutContext = React.createContext<LayoutContextData | undefined>(
	undefined,
);

export function useLayoutContext() {
	const context = React.useContext(LayoutContext);
	if (!context) {
		throw new Error(
			"useLayoutContext must be used within LayoutContextProvider",
		);
	}
	return context;
}

export function LayoutContextProvider({
	children,
	value,
}: {
	children: React.ReactNode;
	value: LayoutContextData;
}) {
	return (
		<LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
	);
}
