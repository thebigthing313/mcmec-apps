import {
	createRouter,
	RouterProvider,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "@mcmec/ui/styles/globals.css";
import { ASSET_URLS } from "@mcmec/lib/constants/assets";
import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { ErrorDisplay } from "@mcmec/ui/blocks/error";
import { NotFound } from "@mcmec/ui/blocks/not-found";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient, supabase } from "./lib/queryClient";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Set favicon from constants
const faviconLink = document.querySelector(
	"link[rel='icon']",
) as HTMLLinkElement;
if (faviconLink) {
	faviconLink.href = ASSET_URLS.favicon;
}

// Create a new router instance
const router = createRouter({
	context: {
		queryClient: queryClient,
		supabase: supabase,
	},
	defaultErrorComponent: (error) => <ErrorComponent {...error} />,
	defaultNotFoundComponent: () => <NotFoundComponent />,
	routeTree,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

// Render the app
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error(ErrorMessages.BROWSER.ROOT_ELEMENT_NOT_FOUND);
if (!rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<StrictMode>
			<QueryClientProvider client={queryClient}>
				<RouterProvider router={router} />
				<ReactQueryDevtools initialIsOpen={false} />
			</QueryClientProvider>
		</StrictMode>,
	);
}

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
