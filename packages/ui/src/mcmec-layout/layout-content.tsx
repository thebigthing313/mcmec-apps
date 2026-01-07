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
					<Separator
						orientation="vertical"
						className="mr-2 data-[orientation=vertical]:h-4"
					/>
					{breadcrumb && breadcrumb}
				</div>
			</header>
			<div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
		</SidebarInset>
	);
}
