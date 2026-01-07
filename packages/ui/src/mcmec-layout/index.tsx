"use client";

import { AppSwitcher } from "./app-switcher";
import { LayoutBreadcrumb } from "./layout-breadcrumb";
import { LayoutContent } from "./layout-content";
import { LayoutRoot } from "./layout-root";
import { LayoutSidebar } from "./layout-sidebar";
import { NavUser } from "./nav-user";

// Compound component structure
export const Layout = Object.assign(LayoutRoot, {
	Sidebar: LayoutSidebar,
	Content: LayoutContent,
	AppSwitcher: AppSwitcher,
	NavUser: NavUser,
	Breadcrumb: LayoutBreadcrumb,
});

export { AppSwitcher } from "./app-switcher";
export type { BreadcrumbPart } from "./layout-breadcrumb";
export { LayoutBreadcrumb } from "./layout-breadcrumb";
export { LayoutContent } from "./layout-content";
export type { LayoutContextData } from "./layout-context";
export { useLayoutContext } from "./layout-context";
// Export individual components for flexibility
// Backwards compatibility exports
export { LayoutRoot } from "./layout-root";
export { LayoutSidebar } from "./layout-sidebar";
export { NavUser } from "./nav-user";
