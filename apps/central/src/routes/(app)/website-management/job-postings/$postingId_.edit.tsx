import { createFileRoute, notFound } from "@tanstack/react-router";
import { EditJobPostingPage } from "@/src/apps/website-management/job-postings/edit-job-posting-page";

export const Route = createFileRoute(
	"/(app)/website-management/job-postings/$postingId_/edit",
)({
	component: EditJobPostingPage,
	// Preloads what the screen subscribes to; a missing id is not-found, as on every record
	// route in central.
	loader: async ({ context, params }) => {
		await context.jobPostings.preload();
		const posting = context.jobPostings.get(params.postingId);
		if (!posting) {
			throw notFound();
		}
		return { crumb: "Edit", posting };
	},
});
