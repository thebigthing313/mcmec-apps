import { createFileRoute } from "@tanstack/react-router";
import { WeeklyActivityPage } from "@/src/apps/website-management/weekly-activity-page";

export const Route = createFileRoute(
	"/(app)/website-management/weekly-activity/",
)({
	beforeLoad: ({ context }) =>
		context.websiteManagementTables.use("mosquitoActivityData"),
	component: WeeklyActivityPage,
	// Preloads nothing: `mosquitoActivityData` is on demand, so the chart's own live query loads
	// its slice.
	loader: () => ({ crumb: "Weekly Mosquito Activity" }),
});
