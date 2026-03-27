import { UnauthenticatedError } from "@mcmec/auth/errors";
import { signOut } from "@mcmec/auth/signOut";
import type { Claims } from "@mcmec/auth/types";
import { verifyClaims } from "@mcmec/auth/verifyClaims";
import { filterAppsByPermissions } from "@mcmec/lib/constants/apps";
import { TooltipProvider } from "@mcmec/ui/components/tooltip";
import { Layout } from "@mcmec/ui/mcmec-layout";
import {
	createFileRoute,
	Outlet,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { HrSidebar } from "@/src/components/hr-sidebar";
import { employees } from "@/src/lib/db";

export const Route = createFileRoute("/(app)")({
	beforeLoad: async ({ context, location }) => {
		try {
			const claims = await verifyClaims({
				client: context.supabase,
				permission: "manage_employees",
			});
			return { claims };
		} catch (error) {
			if (error instanceof UnauthenticatedError) {
				throw redirect({
					search: { redirect: location.href },
					to: "/login",
				});
			}
			throw error;
		}
	},
	component: LayoutComponent,
	loader: () => {
		employees.stateWhenReady();
	},
});

function LayoutComponent() {
	const { supabase, claims } = Route.useRouteContext();
	const { permissions } = claims as Claims;
	const accessibleApps = filterAppsByPermissions(permissions);

	const navigate = useNavigate();
	const handleLogout = async () => {
		await signOut({ client: supabase });
		navigate({ to: "/login" });
	};

	return (
		<TooltipProvider>
			<Layout
				value={{
					activeApp: "HR",
					apps: accessibleApps,
					onLogout: handleLogout,
					user: {
						avatar: undefined,
						name: "User Name",
						title: "Job Title",
					},
				}}
			>
				<Layout.Sidebar>
					<Layout.Sidebar.Header>
						<Layout.AppSwitcher />
					</Layout.Sidebar.Header>
					<Layout.Sidebar.Content>
						<HrSidebar />
					</Layout.Sidebar.Content>
					<Layout.Sidebar.Footer>
						<Layout.NavUser />
					</Layout.Sidebar.Footer>
				</Layout.Sidebar>
				<Layout.Content>
					<Outlet />
				</Layout.Content>
			</Layout>
		</TooltipProvider>
	);
}
