import { createFileRoute, notFound } from "@tanstack/react-router";
import { EditMeetingPage } from "@/src/apps/website-management/meetings/edit-meeting-page";

export const Route = createFileRoute(
	"/(app)/website-management/meetings/$meetingId_/edit",
)({
	component: EditMeetingPage,
	// Preloads what the screen subscribes to; a missing id is not-found, as on every record
	// route in central.
	loader: async ({ context, params }) => {
		await context.meetings.preload();
		const meeting = context.meetings.get(params.meetingId);
		if (!meeting) {
			throw notFound();
		}
		return { crumb: "Edit", meeting };
	},
});
