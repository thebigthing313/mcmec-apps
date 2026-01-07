import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "@mcmec/ui/styles/globals.css";
import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { createClient } from "@mcmec/supabase/client";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
	throw new Error(ErrorMessages.SERVER.ENVIRONMENT_MISCONFIGURED);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Create a new router instance
const router = createRouter({
	routeTree,
	context: {
		supabase: supabase,
	},
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
			<RouterProvider router={router} />
		</StrictMode>,
	);
}
