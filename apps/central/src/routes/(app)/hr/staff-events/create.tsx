import { createFileRoute } from "@tanstack/react-router";
import { CreateStaffEventPage } from "@/src/apps/hr/staff-events/create-staff-event-page";

export const Route = createFileRoute("/(app)/hr/staff-events/create")({
	component: CreateStaffEventPage,
	// Preloads nothing: the form subscribes to no table.
	loader: () => ({ crumb: "Add" }),
});
