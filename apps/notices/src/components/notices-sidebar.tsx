import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@mcmec/ui/components/sidebar";
import { Link, type LinkProps } from "@tanstack/react-router";
import { BookOpen, Group, Home } from "lucide-react";

type SidebarItem = {
	label: string;
	linkProps: LinkProps;
	icon: React.ReactNode;
};

const items: SidebarItem[] = [
	{ label: "Dashboard", linkProps: { to: "/" }, icon: <Home /> },
	{
		label: "Public Notices",
		linkProps: { to: "/notices" },
		icon: <BookOpen />,
	},
	{ label: "Categories", linkProps: { to: "/categories" }, icon: <Group /> },
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
