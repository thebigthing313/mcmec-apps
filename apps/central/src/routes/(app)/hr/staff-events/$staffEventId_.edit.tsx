import { createFileRoute, notFound } from "@tanstack/react-router";
import { EditStaffEventPage } from "@/src/apps/hr/staff-events/edit-staff-event-page";

export const Route = createFileRoute(
	"/(app)/hr/staff-events/$staffEventId_/edit",
)({
	component: EditStaffEventPage,
	// Preloads what the screen subscribes to; a missing id is not-found, as on every record
	// route in central.
	loader: async ({ context, params }) => {
		await context.staffEvents.preload();
		const staffEvent = context.staffEvents.get(params.staffEventId);
		if (!staffEvent) {
			throw notFound();
		}
		return { crumb: "Edit", staffEvent };
	},
});
