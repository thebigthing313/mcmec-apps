import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@mcmec/ui/components/sidebar";
import { Link, type LinkProps } from "@tanstack/react-router";
import { BookOpen, Group, Home, Users } from "lucide-react";

type SidebarItem = {
	label: string;
	linkProps: LinkProps;
	icon: React.ReactNode;
};

const items: SidebarItem[] = [
	{ icon: <Home />, label: "Dashboard", linkProps: { to: "/" } },
	{
		icon: <BookOpen />,
		label: "Public Notices",
		linkProps: { to: "/notices" },
	},
	{ icon: <Group />, label: "Categories", linkProps: { to: "/categories" } },
	{ icon: <Users />, label: "Meetings", linkProps: { to: "/meetings" } },
];
export function CentralSidebar() {
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
