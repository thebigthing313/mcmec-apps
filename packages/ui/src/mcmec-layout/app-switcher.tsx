"use client";

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
import type { AnchorHTMLAttributes, ComponentType, ReactNode } from "react";

type SwitcherLinkProps = {
	to: string;
	children?: ReactNode;
	className?: string;
};

/**
 * One App's link. Forwards whatever props the `asChild` parent slots onto it (class, handlers,
 * ref, ARIA), so it can sit under a menu item or a sidebar button alike.
 */
function AppLink({
	children,
	href,
	LinkComponent,
	...slotted
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
	children: ReactNode;
	href: string;
	LinkComponent: ComponentType<SwitcherLinkProps>;
}) {
	return (
		<LinkComponent {...(slotted as SwitcherLinkProps)} to={href}>
			{children}
		</LinkComponent>
	);
}

/**
 * `LinkComponent` is the router's link, injected the way `LayoutBreadcrumb` injects it. Every
 * App lives in `central` at a path, so each switcher entry is an in-app router link (no reload).
 */
export function AppSwitcher({
	LinkComponent,
}: {
	LinkComponent: ComponentType<SwitcherLinkProps>;
}) {
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
	 * it is the identity mark and the collapsed rail's tooltip hangs off it. It is not a menu
	 * button — a control that opens nothing is a promise the chrome cannot keep — but a link to
	 * the App's home, so it can still take focus and a keyboard user still gets the tooltip.
	 */
	const [onlyApp] = apps;
	if (apps.length === 1 && onlyApp) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton asChild size="lg" tooltip={tooltip}>
						<AppLink href={onlyApp.href} LinkComponent={LinkComponent}>
							{identity}
						</AppLink>
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
									<AppLink href={app.href} LinkComponent={LinkComponent}>
										{body}
									</AppLink>
								</DropdownMenuItem>
							);
						})}
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
