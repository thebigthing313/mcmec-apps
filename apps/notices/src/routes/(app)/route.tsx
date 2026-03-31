import { UnauthenticatedError } from "@mcmec/auth/errors";
import { processAuthRedirect } from "@mcmec/auth/handleCrossAppAuth";
import { signOut } from "@mcmec/auth/signOut";
import type { Claims } from "@mcmec/auth/types";
import { verifyClaims } from "@mcmec/auth/verifyClaims";
import { AVAILABLE_APPS, getCentralLoginUrl } from "@mcmec/lib/constants/apps";
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
import { supabase } from "@/src/lib/queryClient";

export const Route = createFileRoute("/(app)")({
	beforeLoad: async () => {
		await processAuthRedirect(supabase);
		try {
			const claims = await verifyClaims({
				client: supabase,
				permission: "public_notices",
			});
			return { claims };
		} catch (error) {
			if (error instanceof UnauthenticatedError) {
				throw redirect({
					href: getCentralLoginUrl(window.location.origin),
				});
			}
			throw error;
		}
	},
	component: LayoutComponent,
	loader: async ({ context }) => {
		await context.db.employees.preload();
	},
});

function LayoutComponent() {
	const { claims, db } = Route.useRouteContext();
	const { userId } = claims as Claims;
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
					activeApp: "Public Notices",
					apps: AVAILABLE_APPS,
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
