import { ForbiddenError, UnauthenticatedError } from "@mcmec/auth/errors";
import { signOut } from "@mcmec/auth/signOut";
import type { Claims } from "@mcmec/auth/types";
import { verifyClaims } from "@mcmec/auth/verifyClaims";
import { AVAILABLE_APPS } from "@mcmec/lib/constants/apps";
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
import { employees } from "@/src/lib/collections/employees";

export const Route = createFileRoute("/(app)")({
	beforeLoad: async ({ context, location }) => {
		try {
			const claims = await verifyClaims({
				client: context.supabase,
				permission: "public_notices",
			});
			return { claims };
		} catch (error) {
			if (error instanceof UnauthenticatedError) {
				throw redirect({
					search: { redirect: location.href },
					to: "/login",
				});
			}
			if (error instanceof ForbiddenError) {
				throw redirect({ to: "/login" });
			}
			throw error;
		}
	},
	component: LayoutComponent,
	loader: () => {
		employees.preload();
	},
});

function LayoutComponent() {
	const { supabase, claims } = Route.useRouteContext();
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
			.from({ employee: employees })
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
