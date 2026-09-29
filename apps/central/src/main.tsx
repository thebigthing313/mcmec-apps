import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "@mcmec/ui/styles/globals.css";
import { favicon } from "@mcmec/lib/constants/assets";
import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createCentralCollections } from "./lib/collections";
import { API_URL, authClient, queryClient } from "./lib/queryClient";
import { createCentralRouter } from "./router";

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

const router = createCentralRouter({
	apiUrl: API_URL,
	authClient,
	collections,
	queryClient,
});

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
