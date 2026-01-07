import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
} from "@mcmec/ui/components/sidebar";

export function CentralSidebar() {
	return (
		<SidebarGroup>
			<SidebarGroupLabel>My Apps</SidebarGroupLabel>
			<SidebarGroupContent></SidebarGroupContent>
		</SidebarGroup>
	);
}
