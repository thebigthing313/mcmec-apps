import { filterAppsByPermissions } from "@mcmec/lib/constants/apps";
import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { verifyClaims } from "@mcmec/supabase/auth/claims";
import { checkSession } from "@mcmec/supabase/auth/session";
import { signOut } from "@mcmec/supabase/auth/signOut";
import { Layout } from "@mcmec/ui/mcmec-layout";
import {
	createFileRoute,
	Outlet,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { CentralSidebar } from "@/src/components/central-sidebar";

type CompleteClaims = {
	userId: string;
	userEmail: string;
	profileId: string;
	employeeId: string;
	permissions: string[];
};

export const Route = createFileRoute("/(app)")({
	beforeLoad: async ({ context, location }) => {
		// 1. Verify Session
		const session = await checkSession({ client: context.supabase });
		if (!session) {
			throw redirect({
				to: "/login",
				search: { redirect: location.href },
			});
		}

		// 2. Verify Claims
		const claims = await verifyClaims({ client: context.supabase });

		// 3. Provide claims to all child routes
		return { claims: claims as CompleteClaims };
	},
	component: LayoutComponent,
	errorComponent: ({ error }) => {
		// Handle NOT_ONBOARDED error
		if (error.message === ErrorMessages.AUTH.NOT_ONBOARDED) {
			return (
				<div className="flex min-h-screen items-center justify-center">
					<div className="text-center">
						<h1 className="mb-4 font-bold text-2xl">Onboarding Required</h1>
						<p className="text-gray-600">
							Your account needs to be onboarded before you can access this
							application.
						</p>
						<p className="mt-2 text-gray-600">
							Please contact your administrator for assistance.
						</p>
					</div>
				</div>
			);
		}

		// Generic error fallback
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
	const { permissions } = claims;
	const accessibleApps = filterAppsByPermissions(permissions);

	const navigate = useNavigate();
	const handleLogout = async () => {
		await signOut({ client: supabase });
		navigate({ to: "/login" });
	};

	return (
		<Layout
			value={{
				apps: accessibleApps,
				activeApp: "Central",
				user: {
					name: "User Name",
					title: "Job Title",
					avatar: "/avatar.png",
				},
				onLogout: handleLogout,
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
