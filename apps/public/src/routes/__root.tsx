import type { SupabaseClient } from "@mcmec/supabase/client";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Footer } from "../components/footer";
import { Navbar } from "../components/nav-bar";

export interface MyRouterContext {
	supabase: SupabaseClient;
	queryClient: QueryClient;
}

const RootLayout = () => (
	<div className="flex min-h-screen flex-col bg-background">
		<Navbar />

		<main className="my-8 flex-1" id="main-content">
			<Outlet />
		</main>
		<Footer />
		<TanStackRouterDevtools />
	</div>
);

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: RootLayout,
});
