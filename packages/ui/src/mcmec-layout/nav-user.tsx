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
import { Skeleton } from "@mcmec/ui/components/skeleton";
import { useLayoutContext } from "@mcmec/ui/mcmec-layout/layout-context.js";
import { ChevronsUpDown, LogOut } from "lucide-react";

export function NavUser() {
	const { user, onLogout } = useLayoutContext();
	const { isMobile } = useSidebar();

	/*
	 * The employee record arrives over Electric, so on a cold load there is no name yet. Every
	 * application used to fill that gap with the literal string "[missing name]" — which was both
	 * the placeholder and, in practice, the loading state, so every user saw bracket-notation debug
	 * text in the sidebar of a public agency's tool until sync landed.
	 */
	const isLoading = !user.name;
	const userInitials = (user.name ?? "")
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
							tooltip={
								user.name && user.title
									? `${user.name} — ${user.title}`
									: (user.name ?? "Signed in")
							}
						>
							<Avatar className="h-8 w-8 rounded-lg">
								<AvatarImage
									alt={user.name ?? ""}
									src={user.avatar || undefined}
								/>
								<AvatarFallback className="rounded-lg">
									{userInitials}
								</AvatarFallback>
							</Avatar>
							{isLoading ? (
								<div className="grid flex-1 gap-1.5">
									{/*
									 * Skeletons carry no text, and the avatar's alt and initials are both
									 * empty until the record arrives — so without this the trigger is a
									 * button with no accessible name at all during the cold-load window,
									 * announced as just "button". It previously got its name from
									 * `{user.name}`. The tooltip does not substitute: it renders only
									 * while the rail is collapsed.
									 */}
									<span className="sr-only">Account menu, loading</span>
									<Skeleton className="h-3.5 w-28" />
									<Skeleton className="h-3 w-20" />
								</div>
							) : (
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">{user.name}</span>
									<span className="truncate text-xs">{user.title}</span>
								</div>
							)}
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
									<AvatarImage
										alt={user.name ?? ""}
										src={user.avatar || undefined}
									/>
									<AvatarFallback className="rounded-lg">
										{userInitials}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									{/* Same window, inside the open menu: two blank lines without this. */}
									<span className="truncate font-medium">
										{user.name ?? "Signed in"}
									</span>
									<span className="truncate text-xs">
										{user.title ?? "Loading your record…"}
									</span>
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
