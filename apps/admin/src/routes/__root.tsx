import type { AuthClient } from "@mcmec/auth/client";
import { Toaster } from "@mcmec/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { Db } from "@/src/lib/db";

export interface MyRouterContext {
	authClient: AuthClient;
	db: Db;
	queryClient: QueryClient;
}

const RootLayout = () => (
	<>
		<Outlet />
		{/* Where a refused command says why — `toastOnError` writes here (#165). */}
		<Toaster />
		<TanStackRouterDevtools />
	</>
);

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: RootLayout,
});
