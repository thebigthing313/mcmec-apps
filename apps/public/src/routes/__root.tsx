import type { SupabaseClient } from "@mcmec/supabase/client";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Footer } from "../components/footer";
import { Header } from "../components/header";
import { Navbar } from "../components/nav-bar";

export interface MyRouterContext {
	supabase: SupabaseClient;
	queryClient: QueryClient;
}

const RootLayout = () => (
	<div className="flex min-h-screen flex-col bg-background p-4">
		<Header />
		<Navbar />

		<main className="max-w-7xl flex-1 p-4">
			<Outlet />
		</main>
		<Footer />
		<TanStackRouterDevtools />
	</div>
);

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: RootLayout,
});
