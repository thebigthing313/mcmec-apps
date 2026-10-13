import { createFileRoute } from "@tanstack/react-router";
import { HolidaysPage } from "@/src/apps/hr/holidays/holidays-page";
import { validateHolidaysSearch } from "@/src/lib/hr-search";

export const Route = createFileRoute("/(app)/hr/holidays/")({
	component: HolidaysPage,
	loader: async ({ context }) => {
		await context.holidays.preload();
		return { crumb: "Holidays" };
	},
	validateSearch: validateHolidaysSearch,
});
