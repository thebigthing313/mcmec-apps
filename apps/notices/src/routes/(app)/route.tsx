import { AVAILABLE_APPS } from "@mcmec/lib/constants/apps";
import { verifyClaims } from "@mcmec/supabase/auth/claims";
import { checkSession } from "@mcmec/supabase/auth/session";
import { signOut } from "@mcmec/supabase/auth/signOut";
import { Layout } from "@mcmec/ui/mcmec-layout";
import {
	createFileRoute,
	isMatch,
	Outlet,
	redirect,
	useMatches,
	useNavigate,
} from "@tanstack/react-router";
import { CentralSidebar } from "@/src/components/notices-sidebar";

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
		const claims = await verifyClaims({
			client: context.supabase,
			permission: "public_notices",
		});

		// 3. Provide claims to all child routes
		return { claims: claims as CompleteClaims };
	},
	component: LayoutComponent,
});

function LayoutComponent() {
	const { supabase } = Route.useRouteContext();
	const navigate = useNavigate();
	const matches = useMatches();
	const matchesWithCrumbs = matches.filter((match) =>
		isMatch(match, "loaderData.crumb"),
	);
	const breadcrumbParts = matchesWithCrumbs.map((match) => ({
		label: match.loaderData?.crumb as string,
		href: match.fullPath as string,
	}));
	const handleLogout = async () => {
		await signOut({ client: supabase });
		navigate({ to: "/login" });
	};

	return (
		<Layout
			value={{
				apps: AVAILABLE_APPS,
				activeApp: "Public Notices",
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
			<Layout.Content
				breadcrumb={<Layout.Breadcrumb items={breadcrumbParts} />}
			>
				<Outlet />
			</Layout.Content>
		</Layout>
	);
}
