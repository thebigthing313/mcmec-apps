"use client";

import { Separator } from "@mcmec/ui/components/separator";
import { SidebarInset, SidebarTrigger } from "@mcmec/ui/components/sidebar";
import type React from "react";

interface LayoutContentProps {
	children: React.ReactNode;
	breadcrumb?: React.ReactNode;
}

export function LayoutContent({ children, breadcrumb }: LayoutContentProps) {
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
