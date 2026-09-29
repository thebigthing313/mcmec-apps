import type { AuthClient } from "@mcmec/auth/client";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { CentralCollections } from "@/src/lib/collections";

export interface MyRouterContext {
	/**
	 * The `api` origin, for the commands no collection owns (an invite, a Grant). Carried here
	 * rather than imported from `src/lib/queryClient`, so App code reaches it the way it reaches
	 * everything else the session holds, and the route tests can hand it one.
	 */
	apiUrl: string;
	authClient: AuthClient;
	/**
	 * The session's collection registry. Routes ask it for tables in `beforeLoad`
	 * (`context.collections.use("notices")`) and pass what it returns down through context —
	 * see src/lib/collections/registry.ts.
	 */
	collections: CentralCollections;
	queryClient: QueryClient;
}

const RootLayout = () => (
	<>
		<Outlet />
		<TanStackRouterDevtools />
	</>
);

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: RootLayout,
});
