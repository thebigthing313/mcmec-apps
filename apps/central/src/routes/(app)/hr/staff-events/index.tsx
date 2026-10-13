// validateSearch is never code-split, so it imports the component-free half.
import { validateRecordIndexSearch } from "@mcmec/ui/blocks/record-index-search";
import { createFileRoute } from "@tanstack/react-router";
import { StaffEventsPage } from "@/src/apps/hr/staff-events/staff-events-page";

export const Route = createFileRoute("/(app)/hr/staff-events/")({
	component: StaffEventsPage,
	loader: async ({ context }) => {
		await context.staffEvents.preload();
		return { crumb: "Staff Events" };
	},
	validateSearch: validateRecordIndexSearch,
});
