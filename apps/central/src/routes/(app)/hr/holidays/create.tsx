import { createFileRoute } from "@tanstack/react-router";
import { CreateHolidayPage } from "@/src/apps/hr/holidays/create-holiday-page";

export const Route = createFileRoute("/(app)/hr/holidays/create")({
	component: CreateHolidayPage,
	// Preloads nothing: the form subscribes to no table.
	loader: () => ({ crumb: "Add" }),
});
