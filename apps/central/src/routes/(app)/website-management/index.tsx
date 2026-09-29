import { createFileRoute } from "@tanstack/react-router";
import { WebsiteManagementDashboard } from "@/src/apps/website-management/dashboard";

/**
 * The Signal Strip: Website Management's index, moved from the old app's `/`.
 *
 * It reads across seven tables, so it asks for all seven itself rather than the App's layout
 * asking on its behalf (#239: an App layout owns no table).
 */
export const Route = createFileRoute("/(app)/website-management/")({
	beforeLoad: ({ context }) =>
		context.websiteManagementTables.use(
			"notices",
			"publicRequests",
			"meetings",
			"spraySchedules",
			"insecticides",
			"documents",
			"jobPostings",
		),
	component: WebsiteManagementDashboard,
	// Preloads every eager table the dashboard live-queries. `publicRequests` is on demand, so
	// `preload()` would be a no-op: its live query loads its own slice, and the band waits for
	// every query to report ready before choosing which signal to open on.
	loader: async ({ context }) => {
		await Promise.all([
			context.notices.preload(),
			context.meetings.preload(),
			context.spraySchedules.preload(),
			context.insecticides.preload(),
			context.documents.preload(),
			context.jobPostings.preload(),
		]);
	},
});
