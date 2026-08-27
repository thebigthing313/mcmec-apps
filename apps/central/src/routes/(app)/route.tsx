import { UnauthenticatedError } from "@mcmec/auth/errors";
import { signOut } from "@mcmec/auth/signOut";
import type { Claims } from "@mcmec/auth/types";
import { verifyClaims } from "@mcmec/auth/verifyClaims";
import { filterAppsByPermissions } from "@mcmec/lib/constants/apps";
import { Layout } from "@mcmec/ui/mcmec-layout";
import { eq, useLiveQuery } from "@tanstack/react-db";
import {
	createFileRoute,
	isMatch,
	Link,
	Outlet,
	redirect,
	useLocation,
	useMatches,
	useNavigate,
} from "@tanstack/react-router";
import { CentralSidebar } from "@/src/components/central-sidebar";

export const Route = createFileRoute("/(app)")({
	beforeLoad: async ({ context, location }) => {
		try {
			const claims = await verifyClaims({ client: context.authClient });
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
	// Seeds the breadcrumb so every trail reaches the dashboard.
	loader: () => ({ crumb: "Dashboard" }),
});

function LayoutComponent() {
	const { authClient, claims, db } = Route.useRouteContext();
	const { permissions, userId } = claims as Claims;
	const accessibleApps = filterAppsByPermissions(permissions);
	const location = useLocation();
	const matches = useMatches();
	const breadcrumbParts = matches
		.filter((match) => isMatch(match, "loaderData.crumb"))
		.map((match) => ({
			href: match.pathname as string,
			label: match.loaderData?.crumb as string,
		}));

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
		<Layout
			value={{
				activeApp: "Central",
				apps: accessibleApps,
				currentPath: location.pathname,
				onLogout: handleLogout,
				user: {
					avatar: undefined,
					name: employee?.display_name,
					title: employee?.display_title,
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
						getLinkProps={(href) => ({
							activeOptions: { exact: true },
							to: href,
						})}
						items={breadcrumbParts}
						LinkComponent={Link}
					/>
				}
			>
				<Outlet />
			</Layout.Content>
		</Layout>
	);
}
