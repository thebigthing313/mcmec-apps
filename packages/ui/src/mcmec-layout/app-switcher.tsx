"use client";

import { CENTRAL_URL, isCentralPath } from "@mcmec/lib/constants/apps";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@mcmec/ui/components/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@mcmec/ui/components/sidebar";
import { useLayoutContext } from "@mcmec/ui/mcmec-layout/layout-context.js";
import { Check, ChevronsUpDown } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

type SwitcherLinkProps = {
	to: string;
	children?: ReactNode;
	className?: string;
};

/**
 * `LinkComponent` is the router's link, injected the way `LayoutBreadcrumb` injects it. An App
 * whose `href` is a path lives in `central`, so with a `LinkComponent` it is an in-app router
 * link (no reload); without one — the retiring apps on their own origins — the path is resolved
 * against `CENTRAL_URL`. An App whose `href` is absolute is always a plain cross-origin anchor.
 */
export function AppSwitcher({
	LinkComponent,
}: {
	LinkComponent?: ComponentType<SwitcherLinkProps>;
} = {}) {
	const { companyLogoUrl, companyName, activeApp, apps } = useLayoutContext();
	const { isMobile } = useSidebar();

	const identity = (
		<>
			<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white text-sidebar-primary-foreground">
				<img alt={companyName} className="size-8" src={companyLogoUrl} />
			</div>
			<div className="grid flex-1 text-left text-sm leading-tight">
				<span className="truncate font-semibold">{companyName}</span>
				<span className="truncate text-xs">{activeApp}</span>
			</div>
		</>
	);
	/*
	 * Collapsed, this row is the only thing that says which application you are in — and it was
	 * the one row without a tooltip. The rail clips its "MCMEC / Website Management" block to a
	 * bare logo at `size-8`, and the Apps share one mark, one palette and one rail shape. Someone
	 * who works collapsed could act on the wrong App's data with nothing on screen to catch it.
	 */
	const tooltip = `${companyName} — ${activeApp}`;

	/*
	 * One accessible App: nothing to switch to, so no chevron and no menu. The row stays, because
	 * it is the identity mark and the collapsed rail's tooltip hangs off it. It is not a button: a
	 * control that opens nothing is a promise the chrome cannot keep.
	 */
	if (apps.length <= 1) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton
						asChild
						className="hover:bg-transparent active:bg-transparent"
						size="lg"
						tooltip={tooltip}
					>
						<div>{identity}</div>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	// The `if (!activeApp) return null` that used to stand here is gone with `AppName`: an empty
	// name is no longer representable, and silently deleting the sidebar header — the mark and the
	// only route out of the application — was a poor answer to a typo in any case.
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							size="lg"
							tooltip={tooltip}
						>
							{identity}
							<ChevronsUpDown className="ml-auto" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="start"
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						sideOffset={4}
					>
						<DropdownMenuLabel className="text-muted-foreground text-xs">
							Applications
						</DropdownMenuLabel>
						{/*
						 * No keyboard shortcut is advertised here.
						 *
						 * Each row used to print ⌘1–⌘4, inherited verbatim from the shadcn block this
						 * switcher was built from. Nothing ever listened for them: the only modifier
						 * handler in the codebase is ⌘B for the rail. Advertising a shortcut that does
						 * nothing is worse than offering none, because the person who tries it learns
						 * the chrome cannot be trusted, and that lesson generalises.
						 *
						 * Nor were they implementable as written — Chrome binds ⌘/Ctrl+1–8 to tab
						 * switching, so the app would have been fighting the browser for them.
						 */}
						{apps.map((app) => {
							const isCurrent = app.name === activeApp;
							const body = (
								<>
									<div className="flex size-6 shrink-0 items-center justify-center rounded-md border">
										{app.logo}
									</div>
									<div className="grid flex-1 gap-0.5">
										<span className="font-medium leading-none">{app.name}</span>
										{/*
										 * The descriptions were fetched into context and thrown away.
										 * DESIGN.md calls the equivalent copy on the public navigation
										 * load-bearing, because it is how someone who does not know the
										 * difference picks correctly — and a staff member returning to a
										 * seasonal task after eight months is exactly that person.
										 */}
										<span className="text-muted-foreground text-xs leading-snug">
											{app.description}
										</span>
									</div>
									{/*
									 * The list included the application you are already in, unmarked and
									 * indistinguishable from the three that are elsewhere — so the only way
									 * to find the one you wanted was to read all four. Kept in the list
									 * rather than filtered out, because seeing where you are is the point.
									 */}
									{isCurrent ? (
										<Check aria-hidden className="mt-0.5 size-4 shrink-0" />
									) : null}
									{isCurrent ? (
										<span className="sr-only">(current)</span>
									) : null}
								</>
							);
							return (
								<DropdownMenuItem
									asChild
									className="items-start gap-2 p-2"
									key={app.name}
								>
									{!isCentralPath(app.href) ? (
										<a href={app.href}>{body}</a>
									) : LinkComponent ? (
										<LinkComponent to={app.href}>{body}</LinkComponent>
									) : (
										<a
											href={`${CENTRAL_URL}${app.href === "/" ? "" : app.href}`}
										>
											{body}
										</a>
									)}
								</DropdownMenuItem>
							);
						})}
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
