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
import { signOutOfCentral } from "./lib/sign-out";
import { routeTree } from "./routeTree.gen";

/**
 * Central's router, built the same way by `main.tsx` and by the route tests, so the tests
 * exercise the real route tree, context and error handling rather than a copy of them.
 */
export function createCentralRouter({
	authClient,
	collections,
	history,
	queryClient,
}: {
	authClient: AuthClient;
	collections: CentralCollections;
	/** Omitted in the browser; the tests pass a memory history. */
	history?: RouterHistory;
	queryClient: QueryClient;
}) {
	return createRouter({
		context: {
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

function useSignOut() {
	const router = useRouter();
	const { authClient, collections } = router.options.context;
	return () =>
		signOutOfCentral({
			authClient,
			collections,
			toLogin: () => router.navigate({ to: "/login" }),
		});
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
	const signOut = useSignOut();

	if (error instanceof NoEmployeeError) {
		return <EmployeeRequired onSignOut={signOut} />;
	}

	if (error instanceof ForbiddenError) {
		return <AppRoleRefusal onSignOut={signOut} />;
	}

	return (
		<ErrorDisplay
			message={error.message}
			onBack={() => router.history.back()}
			onRetry={() => router.invalidate()}
		/>
	);
}

/**
 * Names the App that refused, from the refused route's `activeApp`, and its App Role from the
 * App list the switcher reads, so the copy cannot drift from the gate.
 */
function AppRoleRefusal({ onSignOut }: { onSignOut: () => Promise<void> }) {
	const refused = useMatches({
		select: (matches) =>
			matches.find(
				(match) =>
					match.status === "error" && match.error instanceof ForbiddenError,
			)?.staticData.activeApp,
	});
	const app = AVAILABLE_APPS.find((candidate) => candidate.name === refused);
	const role = app?.requiredPermission;

	return (
		<AppRoleRequired
			appName={app?.name ?? "This App"}
			LinkComponent={Link}
			onSignOut={onSignOut}
			roleLabel={role ? APP_ROLE_LABELS[role] : "required"}
			to="/"
		/>
	);
}
