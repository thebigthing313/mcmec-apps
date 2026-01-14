import type { SupabaseClient } from "@mcmec/supabase/client";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Header } from "../components/header";
import { Navbar } from "../components/nav-bar";

export interface MyRouterContext {
	supabase: SupabaseClient;
	queryClient: QueryClient;
}

const RootLayout = () => (
	<div className="flex w-full flex-col items-center gap-0 px-18 py-4">
		<Header />
		<Navbar />
		<Outlet />
		<TanStackRouterDevtools />
	</div>
);

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: RootLayout,
});
