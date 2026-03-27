import { NotOnboardedError, UnauthenticatedError } from "@mcmec/auth/errors";
import { signOut } from "@mcmec/auth/signOut";
import type { Claims } from "@mcmec/auth/types";
import { verifyClaims } from "@mcmec/auth/verifyClaims";
import { filterAppsByPermissions } from "@mcmec/lib/constants/apps";
import { Layout } from "@mcmec/ui/mcmec-layout";
import {
	createFileRoute,
	Outlet,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { CentralSidebar } from "@/src/components/central-sidebar";

export const Route = createFileRoute("/(app)")({
	beforeLoad: async ({ context, location }) => {
		try {
			const claims = await verifyClaims({ client: context.supabase });
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
	errorComponent: ({ error }) => {
		if (error instanceof NotOnboardedError) {
			return (
				<div className="flex min-h-screen items-center justify-center">
					<div className="text-center">
						<h1 className="mb-4 font-bold text-2xl">Onboarding Required</h1>
						<p className="text-gray-600">
							Your account needs to be linked to an employee record before you
							can access this application.
						</p>
						<p className="mt-2 text-gray-600">
							Please contact your administrator for assistance.
						</p>
					</div>
				</div>
			);
		}

		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-center">
					<h1 className="mb-4 font-bold text-2xl">Authentication Error</h1>
					<p className="text-red-600">{error.message}</p>
				</div>
			</div>
		);
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
		<Layout
			value={{
				activeApp: "Central",
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
					<CentralSidebar />
				</Layout.Sidebar.Content>
				<Layout.Sidebar.Footer>
					<Layout.NavUser />
				</Layout.Sidebar.Footer>
			</Layout.Sidebar>
			<Layout.Content>
				<Outlet />
			</Layout.Content>
		</Layout>
	);
}
