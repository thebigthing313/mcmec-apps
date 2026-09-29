// validateSearch is never code-split, so it imports the component-free half.
import { validateRecordIndexSearch } from "@mcmec/ui/blocks/record-index-search";
import { createFileRoute } from "@tanstack/react-router";
import { JobPostingsPage } from "@/src/apps/website-management/job-postings/job-postings-page";

export const Route = createFileRoute("/(app)/website-management/job-postings/")(
	{
		component: JobPostingsPage,
		loader: async ({ context }) => {
			await context.jobPostings.preload();
			return { crumb: "Job Postings" };
		},
		validateSearch: validateRecordIndexSearch,
	},
);
