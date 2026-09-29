import type { AuthClient } from "@mcmec/auth/client";
import { ForbiddenError, NoEmployeeError } from "@mcmec/auth/errors";
import { AVAILABLE_APPS } from "@mcmec/lib/constants/apps";
import { APP_ROLE_LABELS } from "@mcmec/lib/constants/roles";
import {
	AppRoleRequired,
	EmployeeRequired,
} from "@mcmec/ui/blocks/access-notice";
import { ErrorDisplay } from "@mcmec/ui/blocks/error";
import { NotFound } from "@mcmec/ui/blocks/not-found";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRouter,
	Link,
	type RouterHistory,
	useMatches,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import type { CentralCollections } from "./lib/collections";
import { refusedAppOf } from "./lib/shell";
import { useSignOutOfCentral } from "./lib/sign-out";
import { routeTree } from "./routeTree.gen";

/**
 * Central's router, built the same way by `main.tsx` and by the route tests, so the tests
 * exercise the real route tree, context and error handling rather than a copy of them.
 */
export function createCentralRouter({
	apiUrl,
	authClient,
	collections,
	history,
	queryClient,
}: {
	apiUrl: string;
	authClient: AuthClient;
	collections: CentralCollections;
	/** Omitted in the browser; the tests pass a memory history. */
	history?: RouterHistory;
	queryClient: QueryClient;
}) {
	return createRouter({
		context: {
			apiUrl,
			authClient,
			collections,
			queryClient,
		},
		defaultErrorComponent: ErrorComponent,
		defaultNotFoundComponent: NotFoundComponent,
		history,
		routeTree,
	});
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof createCentralRouter>;
	}
}

function NotFoundComponent() {
	const navigate = useNavigate();
	return <NotFound onAction={() => navigate({ to: "/" })} />;
}

/**
 * Central's error boundary. Two refusals are pulled out before the generic display gets them,
 * because a refusal is the system working, not a failure to retry:
 *
 * - `NoEmployeeError` is thrown by the root signed-in layout, so it renders where that layout
 *   would have: full-page, with no shell, and Sign out as the only action.
 * - `ForbiddenError` is thrown by an App's layout route, so it renders inside the shell, in the
 *   content area, with the URL kept. The shell falls back to the Self Service Portal's sidebar.
 */
function ErrorComponent({ error }: { error: Error }) {
	const router = useRouter();
	const signOut = useSignOutOfCentral();
	// The refused App is named from the matches, and its App Role from the App list the switcher
	// reads, so the copy cannot drift from the gate.
	const refused = useMatches({ select: refusedAppOf });
	const refusedApp = AVAILABLE_APPS.find((app) => app.name === refused);

	if (error instanceof NoEmployeeError) {
		return <EmployeeRequired onSignOut={signOut} />;
	}

	// A `ForbiddenError` with no gated App above it is a wiring mistake, not a refusal anyone can
	// act on, so it falls through to the generic display rather than inventing an App and a role.
	if (error instanceof ForbiddenError && refusedApp?.requiredPermission) {
		return (
			<AppRoleRequired
				appName={refusedApp.name}
				LinkComponent={Link}
				onSignOut={signOut}
				roleLabel={APP_ROLE_LABELS[refusedApp.requiredPermission]}
				to="/"
			/>
		);
	}

	return (
		<ErrorDisplay
			message={error.message}
			onBack={() => router.history.back()}
			onRetry={() => router.invalidate()}
		/>
	);
}
