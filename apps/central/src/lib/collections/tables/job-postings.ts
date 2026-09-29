import { JobPostingsRowSchema } from "@mcmec/schemas/db/job-postings";
import { createEagerCollection } from "../electric-collection";

/** Job Postings: website content, written under `manage_website` (#145). */
export function create(apiUrl: string) {
	return createEagerCollection({
		apiUrl,
		commands: true,
		schema: JobPostingsRowSchema,
		table: "job_postings",
	});
}
