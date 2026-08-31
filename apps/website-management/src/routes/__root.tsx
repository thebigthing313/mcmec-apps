import type { AuthClient } from "@mcmec/auth/client";
import { Toaster } from "@mcmec/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { Db } from "@/src/lib/db";

export interface MyRouterContext {
	authClient: AuthClient;
	queryClient: QueryClient;
	db: Db;
}

const RootLayout = () => (
	<>
		<Outlet />
		<Toaster />
		{/* Dev only. It shipped unconditionally, so the floating devtools button sat on every
		    production staff screen — including over the dashboard's signal band. */}
		{import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
	</>
);

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: RootLayout,
});
