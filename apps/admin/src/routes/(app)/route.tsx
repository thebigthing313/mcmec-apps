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
import { AdminSidebar } from "@/src/components/admin-sidebar";

export const Route = createFileRoute("/(app)")({
	beforeLoad: async ({ context, location }) => {
		try {
			const claims = await verifyClaims({
				client: context.authClient,
				permission: "manage_users",
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
	loader: async ({ context }) => {
		await context.db.employees.preload();
		// Seeds the breadcrumb so every trail reaches the dashboard.
		return { crumb: "Dashboard" };
	},
});

function LayoutComponent() {
	const { authClient, claims, db } = Route.useRouteContext();
	const { permissions: userPerms, userId } = claims as Claims;
	const accessibleApps = filterAppsByPermissions(userPerms);
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
				activeApp: "Admin",
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
					<AdminSidebar />
				</Layout.Sidebar.Content>
				<Layout.Sidebar.Footer>
					<Layout.NavUser />
				</Layout.Sidebar.Footer>
			</Layout.Sidebar>
			<Layout.Content
				breadcrumb={
					breadcrumbParts.length > 0 ? (
						<Layout.Breadcrumb
							getLinkProps={(href) => ({
								activeOptions: { exact: true },
								to: href,
							})}
							items={breadcrumbParts}
							LinkComponent={Link}
						/>
					) : undefined
				}
			>
				<Outlet />
			</Layout.Content>
		</Layout>
	);
}
