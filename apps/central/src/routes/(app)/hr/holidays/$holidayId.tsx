import { createFileRoute, notFound } from "@tanstack/react-router";
import { HolidayPage } from "@/src/apps/hr/holidays/holiday-page";

export const Route = createFileRoute("/(app)/hr/holidays/$holidayId")({
	component: HolidayPage,
	// Preloads what the screen subscribes to; a missing id is not-found, as on every record
	// route in central.
	loader: async ({ context, params }) => {
		await context.holidays.preload();
		const holiday = context.holidays.get(params.holidayId);
		if (!holiday) {
			throw notFound();
		}
		return { crumb: holiday.name, holiday };
	},
});
