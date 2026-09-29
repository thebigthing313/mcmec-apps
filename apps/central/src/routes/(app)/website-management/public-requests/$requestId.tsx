import { createFileRoute } from "@tanstack/react-router";
import { PublicRequestPage } from "@/src/apps/website-management/public-requests/public-request-page";

export const Route = createFileRoute(
	"/(app)/website-management/public-requests/$requestId",
)({
	component: PublicRequestPage,
	// Preloads `zipCodes`, which the screen subscribes to for the city and state. The request
	// itself is on demand: there is nothing to preload, and no synced row to `get()` for a
	// not-found here, so the screen's own live query loads it (and renders nothing until then).
	loader: async ({ context }) => {
		await context.zipCodes.preload();
		return { crumb: "Request" };
	},
});
