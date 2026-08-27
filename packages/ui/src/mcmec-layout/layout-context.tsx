"use client";

import type { AccessibleApps, AppName } from "@mcmec/lib/constants/apps";
import * as React from "react";

export interface LayoutContextData {
	companyLogoUrl: string;
	companyName: string;
	/**
	 * Only a list the permission filter produced. See `AccessibleApps` for why the type is
	 * branded rather than a plain array.
	 */
	apps: AccessibleApps;
	/** Which application this is. A union rather than a string: see `AppName`. */
	activeApp: AppName;
	/**
	 * The current pathname, supplied once by the application that owns the router.
	 *
	 * This is the whole of the shell's router knowledge. `LayoutNav` compares each destination
	 * against it to decide the active state, which is how the nav can be owned by `@mcmec/ui`
	 * without `@mcmec/ui` depending on TanStack Router. Required, not optional: an app that
	 * forgets it would render a rail where nothing is ever current, which is the state this
	 * field exists to end.
	 */
	currentPath: string;
	/**
	 * The signed-in person. `name` and `title` are optional because they arrive over Electric and
	 * are genuinely absent on a cold load — every application was papering over that with the
	 * literal strings "[missing name]" and "[missing title]", which is bracket-notation debug text
	 * rendered in the sidebar of a public agency's tool. `NavUser` shows a skeleton instead.
	 */
	user: {
		name?: string | null;
		title?: string | null;
		avatar: string | null | undefined;
	};
	/** Required: an application that omitted it shipped a "Log out" that did nothing. */
	onLogout: () => void;
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
