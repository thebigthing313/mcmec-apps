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
import { ChevronsUpDown } from "lucide-react";

export function AppSwitcher() {
	const { companyLogoUrl, companyName, activeApp, apps } = useLayoutContext();
	const { isMobile } = useSidebar();

	if (!activeApp) {
		return null;
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							size="lg"
							/*
							 * Collapsed, this row is the only thing that says which application you are
							 * in — and it was the one row without a tooltip. The rail clips its
							 * "MCMEC / Website Management" block to a bare logo at `size-8`, and four
							 * staff applications share one mark, one palette and one rail shape. Someone
							 * who works collapsed could act on the wrong application's data with nothing
							 * on screen to catch it. Every nav row got this guarantee; the row carrying
							 * the identity should not have been the exception.
							 */
							tooltip={`${companyName} — ${activeApp}`}
						>
							<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white text-sidebar-primary-foreground">
								<img
									alt={companyName}
									className="size-8"
									src={companyLogoUrl}
								/>
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-semibold">{companyName}</span>
								<span className="truncate text-xs">{activeApp}</span>
							</div>
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
						{apps.map((app) => (
							<DropdownMenuItem asChild className="gap-2 p-2" key={app.name}>
								<a href={app.href}>
									<div className="flex size-6 items-center justify-center rounded-md border">
										{app.logo}
									</div>
									{app.name}
								</a>
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
