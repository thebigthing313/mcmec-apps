import { createFileRoute } from "@tanstack/react-router";
import { HolidaySchedulePage } from "@/src/apps/portal/holidays/holiday-schedule-page";
// validateSearch is never code-split, so it comes from an import-free module.
import { validateHolidayScheduleSearch } from "@/src/lib/portal-search";

export const Route = createFileRoute("/(app)/holidays")({
	beforeLoad: ({ context }) => context.collections.use("holidays"),
	component: HolidaySchedulePage,
	loader: async ({ context }) => {
		await context.holidays.preload();
		return { crumb: "Holiday Schedule" };
	},
	validateSearch: validateHolidayScheduleSearch,
});
