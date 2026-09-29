// validateSearch is never code-split, so its validator lives outside src/apps/.

import { createFileRoute } from "@tanstack/react-router";
import { PublicRequestsPage } from "@/src/apps/website-management/public-requests/public-requests-page";
import { validateRequestsSearch } from "@/src/lib/website-management-search";

export const Route = createFileRoute(
	"/(app)/website-management/public-requests/",
)({
	component: PublicRequestsPage,
	// Preloads nothing: `publicRequests` is on demand, so `preload()` is a no-op; the list's live query loads its own slice and the screen shows loading until it has.
	loader: () => ({ crumb: "Public Requests" }),
	validateSearch: validateRequestsSearch,
});
