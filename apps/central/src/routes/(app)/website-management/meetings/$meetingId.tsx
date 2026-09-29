import { createFileRoute, notFound } from "@tanstack/react-router";
import { MeetingPage } from "@/src/apps/website-management/meetings/meeting-page";

export const Route = createFileRoute(
	"/(app)/website-management/meetings/$meetingId",
)({
	component: MeetingPage,
	// Preloads what the screen subscribes to; a missing id is not-found, as on every record
	// route in central.
	loader: async ({ context, params }) => {
		await context.meetings.preload();
		const meeting = context.meetings.get(params.meetingId);
		if (!meeting) {
			throw notFound();
		}
		return { crumb: meeting.name, meeting };
	},
});
