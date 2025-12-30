import { AVAILABLE_APPS } from "@mcmec/lib/constants/apps";
import { LayoutInset } from "@mcmec/ui/mcmec-layout/layout-inset";
import { LayoutProvider } from "@mcmec/ui/mcmec-layout/layout-provider";
import { LayoutSidebar } from "@mcmec/ui/mcmec-layout/layout-sidebar";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout")({
	component: LayoutComponent,
});

function LayoutComponent() {
	const handleLogout = async () => {
		// TODO: Implement logout logic
		console.log("Logout clicked");
	};

	return (
		<LayoutProvider
			companyLogoUrl="/logo.png"
			companyName="MCMEC"
			apps={AVAILABLE_APPS}
			activeApp="Central"
			user={{
				name: "User Name",
				title: "Job Title",
				avatar: "/avatar.png",
			}}
			onLogout={handleLogout}
		>
			<LayoutSidebar>
				{/* Add custom sidebar navigation items here */}
			</LayoutSidebar>
			<LayoutInset>
				<Outlet />
			</LayoutInset>
		</LayoutProvider>
	);
}
