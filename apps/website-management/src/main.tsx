import {
	createRouter,
	RouterProvider,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "@mcmec/ui/styles/globals.css";
import { ForbiddenError, NotOnboardedError } from "@mcmec/auth/errors";
import { signOut } from "@mcmec/auth/signOut";
import { CENTRAL_URL } from "@mcmec/lib/constants/apps";
import { favicon } from "@mcmec/lib/constants/assets";
import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { APP_ROLE_LABELS, type AppRole } from "@mcmec/lib/constants/roles";
import {
	AppRoleRequired,
	OnboardingRequired,
} from "@mcmec/ui/blocks/access-notice";
import { ErrorDisplay } from "@mcmec/ui/blocks/error";
import { NotFound } from "@mcmec/ui/blocks/not-found";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getDb } from "./lib/db";
import { authClient, queryClient } from "./lib/queryClient";
import { routeTree } from "./routeTree.gen";

// Set favicon
const faviconLink = document.querySelector(
	"link[rel='icon']",
) as HTMLLinkElement;
if (faviconLink) {
	faviconLink.href = favicon;
}

/** This application's name and the one App Role it requires, for the refusal screen. */
const APP_NAME = "Website Management";
const REQUIRED_ROLE: AppRole = "manage_website";

const router = createRouter({
	context: {
		authClient,
		queryClient,
		db: getDb(),
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
 * The application's single error boundary.
 *
 * A refusal is not a failure, so the two auth outcomes are pulled out before the generic
 * display gets a chance at them. Both used to land in `ErrorDisplay`, which framed a permission
 * rule in destructive red under "An Error Has Occurred" and offered "Try Again" as the primary
 * action — and "Try Again" here calls `router.invalidate()`, which re-runs the same `beforeLoad`
 * and refuses again. The one button on the screen was a loop.
 *
 * Everything else keeps `ErrorDisplay` and keeps retry, because a dropped shape request or a
 * network blip is exactly the case retry is for.
 */
function ErrorComponent({ error }: ErrorComponentProps) {
	const router = useRouter();

	if (error instanceof NotOnboardedError) {
		return (
			<OnboardingRequired
				onSignOut={async () => {
					await signOut({ client: authClient });
					router.navigate({ to: "/login" });
				}}
			/>
		);
	}

	if (error instanceof ForbiddenError) {
		return (
			<AppRoleRequired
				appName={APP_NAME}
				centralUrl={CENTRAL_URL}
				onSignOut={async () => {
					await signOut({ client: authClient });
					router.navigate({ to: "/login" });
				}}
				roleLabel={APP_ROLE_LABELS[REQUIRED_ROLE]}
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
