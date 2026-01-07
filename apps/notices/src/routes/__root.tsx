import type { SupabaseClient } from "@mcmec/supabase/client";
import { ErrorDisplay } from "@mcmec/ui/blocks/error";
import { NotFound } from "@mcmec/ui/blocks/not-found";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	Outlet,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export interface MyRouterContext {
	supabase: SupabaseClient;
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
	notFoundComponent: () => <NotFoundComponent />,
	errorComponent: (error) => <ErrorComponent {...error} />,
});

function NotFoundComponent() {
	const navigate = useNavigate();

	return <NotFound onAction={() => navigate({ to: "/" })} />;
}

interface ErrorComponentProps {
	error: Error;
}

function ErrorComponent({ error }: ErrorComponentProps) {
	const router = useRouter();
	return (
		<ErrorDisplay
			message={error.message}
			onBack={() => router.history.back()}
			onRetry={() => router.invalidate()}
		/>
	);
}
