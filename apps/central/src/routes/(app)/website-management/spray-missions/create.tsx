import { createFileRoute } from "@tanstack/react-router";
import { CreateSprayMissionPage } from "@/src/apps/website-management/spray-missions/create-spray-mission-page";

export const Route = createFileRoute(
	"/(app)/website-management/spray-missions/create",
)({
	component: CreateSprayMissionPage,
	loader: async ({ context }) => {
		await Promise.all([
			context.insecticides.preload(),
			context.municipalities.preload(),
		]);
		return { crumb: "Create" };
	},
});
