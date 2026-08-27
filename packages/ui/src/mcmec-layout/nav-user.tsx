"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@mcmec/ui/components/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@mcmec/ui/components/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@mcmec/ui/components/sidebar";
import { useLayoutContext } from "@mcmec/ui/mcmec-layout/layout-context.js";
import { ChevronsUpDown, LogOut } from "lucide-react";

export function NavUser() {
	const { user, onLogout } = useLayoutContext();
	const { isMobile } = useSidebar();

	const userInitials = user.name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							size="lg"
							// Collapsed, the avatar is all that remains of the signed-in person.
							tooltip={user.title ? `${user.name} — ${user.title}` : user.name}
						>
							<Avatar className="h-8 w-8 rounded-lg">
								<AvatarImage alt={user.name} src={user.avatar || undefined} />
								<AvatarFallback className="rounded-lg">
									{userInitials}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">{user.name}</span>
								<span className="truncate text-xs">{user.title}</span>
							</div>
							<ChevronsUpDown className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar className="h-8 w-8 rounded-lg">
									<AvatarImage alt={user.name} src={user.avatar || undefined} />
									<AvatarFallback className="rounded-lg">
										{userInitials}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">{user.name}</span>
									<span className="truncate text-xs">{user.title}</span>
								</div>
							</div>
						</DropdownMenuLabel>
						{/*
						 * Account and Notifications used to sit here, permanently `disabled`, for two
						 * features MCMEC has never had. DESIGN.md's "don't hide a disabled action" is
						 * about an action that exists and is currently unavailable — it was being used
						 * to justify demo furniture. Two thirds of this menu did nothing.
						 */}
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={onLogout}>
							<LogOut />
							Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
