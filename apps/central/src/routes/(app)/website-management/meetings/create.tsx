import { createFileRoute } from "@tanstack/react-router";
import { CreateMeetingPage } from "@/src/apps/website-management/meetings/create-meeting-page";

export const Route = createFileRoute(
	"/(app)/website-management/meetings/create",
)({
	component: CreateMeetingPage,
	// Preloads nothing: the form subscribes to no table.
	loader: () => ({ crumb: "Create" }),
});
