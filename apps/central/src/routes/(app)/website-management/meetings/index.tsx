// validateSearch is never code-split, so it imports the component-free half.
import { validateRecordIndexSearch } from "@mcmec/ui/blocks/record-index-search";
import { createFileRoute } from "@tanstack/react-router";
import { MeetingsPage } from "@/src/apps/website-management/meetings/meetings-page";

export const Route = createFileRoute("/(app)/website-management/meetings/")({
	component: MeetingsPage,
	loader: async ({ context }) => {
		await context.meetings.preload();
		return { crumb: "Meetings" };
	},
	validateSearch: validateRecordIndexSearch,
});
