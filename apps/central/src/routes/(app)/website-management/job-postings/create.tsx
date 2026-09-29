import { createFileRoute } from "@tanstack/react-router";
import { CreateJobPostingPage } from "@/src/apps/website-management/job-postings/create-job-posting-page";

export const Route = createFileRoute(
	"/(app)/website-management/job-postings/create",
)({
	component: CreateJobPostingPage,
	// Preloads nothing: the form subscribes to no table.
	loader: () => ({ crumb: "Create" }),
});
