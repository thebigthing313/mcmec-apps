import { createFileRoute, notFound } from "@tanstack/react-router";
import { EditSprayMissionPage } from "@/src/apps/website-management/spray-missions/edit-spray-mission-page";

export const Route = createFileRoute(
	"/(app)/website-management/spray-missions/$sprayScheduleId_/edit",
)({
	component: EditSprayMissionPage,
	// Preloads what the screen subscribes to; a missing id is not-found, as on every record
	// route in central.
	loader: async ({ context, params }) => {
		await Promise.all([
			context.spraySchedules.preload(),
			context.insecticides.preload(),
			context.municipalities.preload(),
			context.sprayScheduleMunicipalities.preload(),
		]);
		const schedule = context.spraySchedules.get(params.sprayScheduleId);
		if (!schedule) {
			throw notFound();
		}
		return { crumb: "Edit", schedule };
	},
});
