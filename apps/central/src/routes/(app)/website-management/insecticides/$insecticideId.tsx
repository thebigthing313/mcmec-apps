import { createFileRoute, notFound } from "@tanstack/react-router";
import { InsecticidePage } from "@/src/apps/website-management/insecticides/insecticide-page";

export const Route = createFileRoute(
	"/(app)/website-management/insecticides/$insecticideId",
)({
	component: InsecticidePage,
	// Preloads what the screen subscribes to; a missing id is not-found, as on every record
	// route in central.
	loader: async ({ context, params }) => {
		await context.insecticides.preload();
		const insecticide = context.insecticides.get(params.insecticideId);
		if (!insecticide) {
			throw notFound();
		}
		return { crumb: insecticide.trade_name, insecticide };
	},
});
