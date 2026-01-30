import { AVAILABLE_APPS } from "@mcmec/lib/constants/apps";
import { verifyClaims } from "@mcmec/supabase/auth/claims";
import { checkSession } from "@mcmec/supabase/auth/session";
import { signOut } from "@mcmec/supabase/auth/signOut";
import { TooltipProvider } from "@mcmec/ui/components/tooltip";
import { Layout } from "@mcmec/ui/mcmec-layout";
import { eq, useLiveQuery } from "@tanstack/react-db";
import {
	createFileRoute,
	isMatch,
	Link,
	Outlet,
	redirect,
	useMatches,
	useNavigate,
} from "@tanstack/react-router";
import { CentralSidebar } from "@/src/components/notices-sidebar";
import { profiles } from "@/src/lib/collections/profiles";

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
				search: { redirect: location.href },
				to: "/login",
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
	loader: () => {
		profiles.preload();
	},
});

function LayoutComponent() {
	const { supabase, claims } = Route.useRouteContext();
	const navigate = useNavigate();
	const matches = useMatches();
	const matchesWithCrumbs = matches.filter((match) =>
		isMatch(match, "loaderData.crumb"),
	);
	const breadcrumbParts = matchesWithCrumbs.map((match) => ({
		href: match.pathname as string,
		label: match.loaderData?.crumb as string,
	}));
	const handleLogout = async () => {
		await signOut({ client: supabase });
		navigate({ to: "/login" });
	};

	const { data: profile } = useLiveQuery((q) =>
		q
			.from({ profile: profiles })
			.where(({ profile }) => eq(profile.user_id, claims.userId))
			.findOne(),
	);

	return (
		<TooltipProvider>
			<Layout
				value={{
					activeApp: "Public Notices",
					apps: AVAILABLE_APPS,
					onLogout: handleLogout,
					user: {
						avatar: profile?.avatar_url,
						name: profile?.display_name ?? "[missing name]",
						title: profile?.display_title ?? "[missing title]",
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
				<Layout.Content
					breadcrumb={
						<Layout.Breadcrumb
							getLinkProps={(href) => ({ to: href })}
							items={breadcrumbParts}
							LinkComponent={Link}
						/>
					}
				>
					<Outlet />
				</Layout.Content>
			</Layout>
		</TooltipProvider>
	);
}
