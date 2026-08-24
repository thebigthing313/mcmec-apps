import { UnauthenticatedError } from "@mcmec/auth/errors";
import { signOut } from "@mcmec/auth/signOut";
import type { Claims } from "@mcmec/auth/types";
import { verifyClaims } from "@mcmec/auth/verifyClaims";
import { filterAppsByPermissions } from "@mcmec/lib/constants/apps";
import { TooltipProvider } from "@mcmec/ui/components/tooltip";
import { Layout } from "@mcmec/ui/mcmec-layout";
import { eq, useLiveQuery } from "@tanstack/react-db";
import {
	createFileRoute,
	Outlet,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { HrSidebar } from "@/src/components/hr-sidebar";

export const Route = createFileRoute("/(app)")({
	beforeLoad: async ({ context, location }) => {
		try {
			const claims = await verifyClaims({
				client: context.authClient,
				permission: "manage_employees",
			});
			return { claims };
		} catch (error) {
			// Not signed in -> this app's own login (cookie SSO, no cross-app redirect).
			// NotOnboarded / Forbidden fall through to the error boundary.
			if (error instanceof UnauthenticatedError) {
				throw redirect({
					to: "/login",
					search: { redirect: location.href },
				});
			}
			throw error;
		}
	},
	component: LayoutComponent,
	loader: ({ context }) => {
		context.db.employees.stateWhenReady();
	},
});

function LayoutComponent() {
	const { authClient, claims, db } = Route.useRouteContext();
	const { permissions, userId } = claims as Claims;
	const accessibleApps = filterAppsByPermissions(permissions);

	const navigate = useNavigate();
	const handleLogout = async () => {
		await signOut({ client: authClient });
		navigate({ to: "/login" });
	};

	const { data: employee } = useLiveQuery((q) =>
		q
			.from({ employee: db.employees })
			.where(({ employee }) => eq(employee.user_id, userId))
			.findOne(),
	);

	return (
		<TooltipProvider>
			<Layout
				value={{
					activeApp: "HR",
					apps: accessibleApps,
					onLogout: handleLogout,
					user: {
						avatar: undefined,
						name: employee?.display_name ?? "[missing name]",
						title: employee?.display_title ?? "[missing title]",
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
