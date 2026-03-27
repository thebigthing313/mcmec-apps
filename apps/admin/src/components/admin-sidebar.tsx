import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@mcmec/ui/components/sidebar";
import { Link, type LinkProps } from "@tanstack/react-router";
import { Home, Shield } from "lucide-react";

type SidebarItem = {
	icon: React.ReactNode;
	label: string;
	linkProps: LinkProps;
};

const items: SidebarItem[] = [
	{ icon: <Home />, label: "Dashboard", linkProps: { to: "/" } },
	{
		icon: <Shield />,
		label: "Manage Permissions",
		linkProps: { to: "/permissions" },
	},
];

export function AdminSidebar() {
	return (
		<SidebarGroup>
			<SidebarGroupLabel>Menu</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map((item) => (
						<SidebarMenuItem key={item.label}>
							<SidebarMenuButton asChild>
								<Link {...item.linkProps}>
									{item.icon}
									<span>{item.label}</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
