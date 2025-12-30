"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
} from "@mcmec/ui/components/sidebar";
import { AppSwitcher } from "@mcmec/ui/mcmec-layout/app-switcher";
import { NavUser } from "@mcmec/ui/mcmec-layout/nav-user";
import type React from "react";

export function LayoutSidebar({
	children,
	...props
}: React.ComponentProps<typeof Sidebar> & { children?: React.ReactNode }) {
	return (
		<Sidebar collapsible="icon" {...props}>
			{/* fixed header displaying company logo, name, current app, and app switcher*/}
			<SidebarHeader>
				<AppSwitcher />
			</SidebarHeader>
			{/* content will be set at the consuming app */}
			<SidebarContent>{children}</SidebarContent>
			{/* fixed footer with user information */}
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
		</Sidebar>
	);
}
