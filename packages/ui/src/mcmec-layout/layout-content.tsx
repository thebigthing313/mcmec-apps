"use client";

import { Separator } from "@mcmec/ui/components/separator";
import {
	SidebarInset,
	SidebarTrigger,
	useSidebar,
} from "@mcmec/ui/components/sidebar";
import { useLayoutContext } from "@mcmec/ui/mcmec-layout/layout-context.js";
import type React from "react";

interface LayoutContentProps {
	children: React.ReactNode;
	breadcrumb?: React.ReactNode;
}

export function LayoutContent({ children, breadcrumb }: LayoutContentProps) {
	const { activeApp } = useLayoutContext();
	const { state } = useSidebar();
	// Only while collapsed: expanded, the switcher already says this two inches to the left, and
	// repeating it would be chrome talking to itself.
	const showAppName = state === "collapsed";

	return (
		<SidebarInset>
			<header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
				<div className="flex items-center gap-2 px-4">
					<SidebarTrigger className="-ml-1" />
					{/*
					 * The rule earns its place only when it has two things to divide. Three of the
					 * four applications pass no breadcrumb, and each was rendering a vertical rule
					 * separating the trigger from nothing — a dangling stroke in 64px of otherwise
					 * empty chrome. It is decorative, so it is also hidden from assistive tech,
					 * which was announcing a separator before no content.
					 */}
					{showAppName ? (
						<>
							<Separator
								aria-hidden
								className="mr-2 data-[orientation=vertical]:h-4"
								orientation="vertical"
							/>
							<span className="font-medium text-foreground text-sm">
								{activeApp}
							</span>
						</>
					) : null}
					{breadcrumb ? (
						<>
							<Separator
								aria-hidden
								className="mr-2 data-[orientation=vertical]:h-4"
								orientation="vertical"
							/>
							{breadcrumb}
						</>
					) : null}
				</div>
			</header>
			<div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
		</SidebarInset>
	);
}
