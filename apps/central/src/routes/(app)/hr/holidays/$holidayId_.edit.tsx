import { createFileRoute, notFound } from "@tanstack/react-router";
import { EditHolidayPage } from "@/src/apps/hr/holidays/edit-holiday-page";

export const Route = createFileRoute("/(app)/hr/holidays/$holidayId_/edit")({
	component: EditHolidayPage,
	// Preloads what the screen subscribes to; a missing id is not-found, as on every record
	// route in central.
	loader: async ({ context, params }) => {
		await context.holidays.preload();
		const holiday = context.holidays.get(params.holidayId);
		if (!holiday) {
			throw notFound();
		}
		return { crumb: "Edit", holiday };
	},
});
