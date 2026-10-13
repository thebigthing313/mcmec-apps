import { createFileRoute } from "@tanstack/react-router";
import { CalendarPage } from "@/src/apps/portal/calendar/calendar-page";
// validateSearch is never code-split, so it imports the component-free module.
import { validateCalendarSearch } from "@/src/lib/calendar/search";

export const Route = createFileRoute("/(app)/calendar")({
	beforeLoad: ({ context }) =>
		context.collections.use(
			"staffEvents",
			"holidays",
			"meetings",
			"spraySchedules",
		),
	component: CalendarPage,
	// The page subscribes to all four (useCalendarItems), so all four are preloaded.
	loader: async ({ context }) => {
		await Promise.all([
			context.staffEvents.preload(),
			context.holidays.preload(),
			context.meetings.preload(),
			context.spraySchedules.preload(),
		]);
		return { crumb: "Calendar" };
	},
	validateSearch: validateCalendarSearch,
});
