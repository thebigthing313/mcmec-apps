"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
} from "@mcmec/ui/components/sidebar";
import { LayoutNav } from "@mcmec/ui/mcmec-layout/layout-nav.js";
import type React from "react";

export function LayoutSidebar({
	children,
	...props
}: React.ComponentProps<typeof Sidebar> & { children?: React.ReactNode }) {
	return (
		<Sidebar collapsible="icon" {...props}>
			{children}
		</Sidebar>
	);
}

LayoutSidebar.Header = SidebarHeader;
/**
 * The rail's navigation. The shell renders it so that tooltips and the active state cannot be
 * forgotten by a consumer; see `LayoutNav`.
 */
LayoutSidebar.Nav = LayoutNav;
LayoutSidebar.Content = SidebarContent;
LayoutSidebar.Footer = SidebarFooter;
