import {
	createRouter,
	RouterProvider,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "@mcmec/ui/styles/globals.css";
import { NotOnboardedError } from "@mcmec/auth/errors";
import { favicon } from "@mcmec/lib/constants/assets";
import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { OnboardingRequired } from "@mcmec/ui/blocks/access-notice";
import { ErrorDisplay } from "@mcmec/ui/blocks/error";
import { NotFound } from "@mcmec/ui/blocks/not-found";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createCentralCollections } from "./lib/collections";
import { API_URL, authClient, queryClient } from "./lib/queryClient";
import { signOutOfCentral } from "./lib/sign-out";
import { routeTree } from "./routeTree.gen";

// Set favicon
const faviconLink = document.querySelector(
	"link[rel='icon']",
) as HTMLLinkElement;
if (faviconLink) {
	faviconLink.href = favicon;
}

// One registry for the session. It builds nothing yet: each table is imported and built the
// first time a route asks for it, and sign-out empties it for the next User.
const collections = createCentralCollections(API_URL);

const router = createRouter({
	context: {
		authClient,
		collections,
		queryClient,
	},
	defaultErrorComponent: (error) => <ErrorComponent {...error} />,
	defaultNotFoundComponent: () => <NotFoundComponent />,
	routeTree,
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

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

/**
 * Central's error boundary.
 *
 * Central requires no App Role — every signed-in employee has it — so the only auth outcome it
 * can reach is an account with no Employee record behind it. That case had its own hand-rolled
 * screen on the `(app)` route, built from raw `text-gray-600` and `text-red-600`; it is gone,
 * and the shared notice replaces it here where the other three applications keep theirs.
 */
function ErrorComponent({ error }: ErrorComponentProps) {
	const router = useRouter();

	if (error instanceof NotOnboardedError) {
		return (
			<OnboardingRequired
				onSignOut={() =>
					signOutOfCentral({
						authClient,
						collections,
						toLogin: () => router.navigate({ to: "/login" }),
					})
				}
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
