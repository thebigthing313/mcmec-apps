import { filterAppsByPermissions } from "@mcmec/lib/constants/apps";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@mcmec/ui/components/sidebar";
import { useRouteContext } from "@tanstack/react-router";

export function CentralSidebar() {
	const { permissions } = useRouteContext({ from: "/(app)" }).claims;
	const apps = filterAppsByPermissions(permissions);

	return (
		<SidebarGroup>
			<SidebarGroupLabel>My Apps</SidebarGroupLabel>
			<SidebarGroupContent>
				{apps.map((app) => (
					<SidebarMenuItem key={`app-${app.href}`}>
						<SidebarMenuButton asChild>
							<a
								href={`https://${app.href}.${import.meta.env.VITE_DOMAIN_NAME}`}
								target="_blank"
								aria-label={`Open ${app.name} in new tab`}
							>
								{app.logo}
								<span>{app.name}</span>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
