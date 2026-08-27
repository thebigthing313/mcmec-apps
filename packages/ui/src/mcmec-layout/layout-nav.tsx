"use client";

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@mcmec/ui/components/sidebar";
import { useLayoutContext } from "@mcmec/ui/mcmec-layout/layout-context.js";
import type { ComponentType, ReactNode } from "react";

/**
 * One destination in a staff application's sidebar.
 *
 * `linkProps` is whatever the consuming router's link component takes, constrained only to
 * carry a `to`. That single constraint is what lets the shell decide the active state without
 * importing a router: `to` is the destination, and the destination is all the comparison needs.
 */
export interface LayoutNavItem<TLinkProps extends { to: string }> {
	label: string;
	icon: ReactNode;
	linkProps: TLinkProps;
}

/**
 * A titled cluster of destinations.
 *
 * `label` is optional because a two-item rail does not need a heading, and a heading that says
 * nothing ("Menu") is worse than none — it occupies the one line above the nav and disappears
 * entirely when the rail collapses. Name a group only when the name divides the work.
 */
export interface LayoutNavGroup<TLinkProps extends { to: string }> {
	label?: string;
	items: Array<LayoutNavItem<TLinkProps>>;
}

/**
 * True when `to` is the current page or an ancestor of it.
 *
 * Prefix matching is what keeps a drill-down lit: standing on `/notices/42/edit` should show
 * Notices as the active destination, because that is where the user believes they are. The
 * root is exempted from the prefix rule — `/` is a prefix of every path, so matching it loosely
 * would light Dashboard on every screen in the app and make the active state meaningless.
 */
function isPathActive(currentPath: string, to: string): boolean {
	if (to === "/") {
		return currentPath === "/";
	}
	return currentPath === to || currentPath.startsWith(`${to}/`);
}

/**
 * The staff sidebar's navigation, owned by the shell rather than by each application.
 *
 * Four applications previously hand-wrote the same `items.map(SidebarMenuItem →
 * SidebarMenuButton asChild → Link)` block, and all four independently forgot the same two
 * props: `tooltip`, without which the icon-collapsed rail is a column of unlabeled glyphs, and
 * `isActive`, without which nothing in the chrome tells a user where they are. When every
 * consumer makes the same omission, the omission is the seam's fault. So the shell renders the
 * nav and the applications supply data.
 *
 * `LinkComponent` is injected the same way `LayoutBreadcrumb` injects it, which is what keeps
 * `@mcmec/ui` free of a router dependency while still producing client-side navigation.
 */
export function LayoutNav<TLinkProps extends { to: string }>({
	groups,
	LinkComponent,
}: {
	groups: Array<LayoutNavGroup<TLinkProps>>;
	LinkComponent: ComponentType<TLinkProps & { children?: ReactNode }>;
}) {
	const { currentPath } = useLayoutContext();

	return (
		<>
			{groups.map((group, groupIndex) => (
				<SidebarGroup key={group.label ?? `group-${groupIndex}`}>
					{group.label ? (
						<SidebarGroupLabel>{group.label}</SidebarGroupLabel>
					) : null}
					<SidebarGroupContent>
						<SidebarMenu>
							{group.items.map((item) => {
								const isActive = isPathActive(currentPath, item.linkProps.to);
								return (
									<SidebarMenuItem key={item.linkProps.to}>
										<SidebarMenuButton
											// Forwarded through Slot onto the link itself, so the current
											// destination is announced rather than only tinted. The active
											// state must never be carried by color alone.
											aria-current={isActive ? "page" : undefined}
											asChild
											isActive={isActive}
											// Rendered only while the rail is collapsed; this is the entire
											// reason a collapsed rail remains navigable.
											tooltip={item.label}
										>
											<LinkComponent {...item.linkProps}>
												{item.icon}
												<span>{item.label}</span>
											</LinkComponent>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			))}
		</>
	);
}
