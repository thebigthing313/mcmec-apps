import { UnauthenticatedError } from "@mcmec/auth/errors";
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
import { signOutOfCentral } from "@/src/lib/sign-out";

export const Route = createFileRoute("/(app)")({
	beforeLoad: async ({ context, location }) => {
		try {
			const claims = await verifyClaims({ client: context.authClient });
			// `employees` belongs to the shell: every screen shows the signed-in User's Employee
			// name and title. Asked for here, after the claims check, so a signed-out visitor
			// builds nothing, and every child route shares this one instance.
			const { employees } = await context.collections.use("employees");
			return { claims, employees };
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
	// Seeds the breadcrumb so every trail reaches the dashboard. `employees` is preloaded because
	// this route's own component subscribes to it — the rule in src/lib/collections/registry.ts.
	loader: async ({ context }) => {
		await context.employees.preload();
		return { crumb: "Dashboard" };
	},
});

function LayoutComponent() {
	const { authClient, claims, collections, employees } =
		Route.useRouteContext();
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
	const handleLogout = () =>
		signOutOfCentral({
			authClient,
			collections,
			toLogin: () => navigate({ to: "/login" }),
		});

	const { data: employee } = useLiveQuery(
		(q) =>
			q
				.from({ employee: employees })
				.where(({ employee }) => eq(employee.user_id, userId))
				.findOne(),
		[employees, userId],
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
