// validateSearch is never code-split, so its validator lives outside src/apps/.

import { createFileRoute } from "@tanstack/react-router";
import { SprayMissionsPage } from "@/src/apps/website-management/spray-missions/spray-missions-page";
import { validateMissionsSearch } from "@/src/lib/website-management-search";

export const Route = createFileRoute(
	"/(app)/website-management/spray-missions/",
)({
	component: SprayMissionsPage,
	loader: async ({ context }) => {
		await Promise.all([
			context.spraySchedules.preload(),
			context.insecticides.preload(),
			context.municipalities.preload(),
			context.sprayScheduleMunicipalities.preload(),
		]);
		return { crumb: "Spray Missions" };
	},
	validateSearch: validateMissionsSearch,
});
