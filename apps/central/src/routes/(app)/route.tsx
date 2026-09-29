import { UnauthenticatedError } from "@mcmec/auth/errors";
import { readClaims } from "@mcmec/auth/verifyClaims";
import { filterAppsByPermissions } from "@mcmec/lib/constants/apps";
import { Toaster } from "@mcmec/ui/components/sonner";
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
import { PORTAL_SHELL } from "@/src/components/portal-sidebar";
import { requireEmployee } from "@/src/lib/gates";
import { shellAppOf } from "@/src/lib/shell";
import { signOutOfCentral } from "@/src/lib/sign-out";

/**
 * The root signed-in layout: the one shell every App renders inside.
 *
 * It resolves the claims and the signed-in Employee once, for every App. A User with no linked
 * Employee is refused here, so every App refuses them — full-page, with no shell. An App's own
 * layout route adds only its App Role gate, its `activeApp` and its rail (see src/lib/shell.ts).
 *
 * Its own `staticData` is the Self Service Portal's: the portal needs no App Role, so it has no
 * layout route of its own, and it is what the shell shows wherever no App has taken over.
 */
export const Route = createFileRoute("/(app)")({
	beforeLoad: async ({ context, location }) => {
		let session: Awaited<ReturnType<typeof readClaims>>;
		try {
			session = await readClaims({ client: context.authClient });
		} catch (error) {
			if (error instanceof UnauthenticatedError) {
				throw redirect({
					search: { redirect: location.href },
					to: "/login",
				});
			}
			throw error;
		}
		const claims = requireEmployee(session);
		// `employees` belongs to the shell: every screen shows the signed-in User's Employee
		// name and title. Asked for here, after both checks, so a signed-out visitor or a User
		// with no Employee builds nothing, and every child route shares this one instance.
		const { employees } = await context.collections.use("employees");
		return { claims, employees };
	},
	component: LayoutComponent,
	// Seeds the breadcrumb so every trail reaches the dashboard. `employees` is preloaded because
	// this route's own component subscribes to it — the rule in src/lib/collections/registry.ts.
	loader: async ({ context }) => {
		await context.employees.preload();
		return { crumb: "Dashboard" };
	},
	staticData: PORTAL_SHELL,
});

function LayoutComponent() {
	const { authClient, claims, collections, employees } =
		Route.useRouteContext();
	const { permissions, userId } = claims;
	const accessibleApps = filterAppsByPermissions(permissions);
	const location = useLocation();
	const matches = useMatches();
	const { activeApp, sidebar } = shellAppOf(matches, PORTAL_SHELL);
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
				activeApp,
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
					<Layout.AppSwitcher LinkComponent={Link} />
				</Layout.Sidebar.Header>
				<Layout.Sidebar.Content>
					<Layout.Sidebar.Nav groups={sidebar} LinkComponent={Link} />
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
			{/* Where every App's write feedback lands (`toastOnError`, a refusal's own sentence).
			    Here rather than in the root route, whose component is not code-split: this one is,
			    so sonner stays out of the entry chunk. */}
			<Toaster />
		</Layout>
	);
}
