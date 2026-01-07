"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
} from "@mcmec/ui/components/sidebar";
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
LayoutSidebar.Content = SidebarContent;
LayoutSidebar.Footer = SidebarFooter;
