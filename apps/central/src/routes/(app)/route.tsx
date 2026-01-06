import { AVAILABLE_APPS } from "@mcmec/lib/constants/apps";
import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { verifyClaims } from "@mcmec/supabase/auth/claims";
import { checkSession } from "@mcmec/supabase/auth/session";
import { signOut } from "@mcmec/supabase/auth/signOut";
import { LayoutInset } from "@mcmec/ui/mcmec-layout/layout-inset";
import { LayoutProvider } from "@mcmec/ui/mcmec-layout/layout-provider";
import { LayoutSidebar } from "@mcmec/ui/mcmec-layout/layout-sidebar";
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
	const { supabase } = Route.useRouteContext();
	const navigate = useNavigate();
	const handleLogout = async () => {
		await signOut({ client: supabase });
		navigate({ to: "/login" });
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
				<CentralSidebar />
			</LayoutSidebar>
			<LayoutInset>
				<Outlet />
			</LayoutInset>
		</LayoutProvider>
	);
}
