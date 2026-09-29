import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { getRouteApi } from "@tanstack/react-router";
import {
	JobPostingForm,
	type JobPostingFormValues,
} from "@/src/apps/website-management/components/job-posting-form";
import { intents } from "@/src/lib/intents";

const route = getRouteApi("/(app)/website-management/job-postings/create");

export function CreateJobPostingPage() {
	const { jobPostings } = route.useRouteContext();
	const navigate = route.useNavigate();

	const handleSubmit = async (value: JobPostingFormValues) => {
		const now = new Date();
		// The id we mint here is the id the row will have: the envelope carries it and the
		// handler honours it, so the optimistic row and the committed row share a key — which
		// is also what lets this navigate straight to the detail route.
		const id = crypto.randomUUID();
		const tx = jobPostings.insert(
			{
				...value,
				created_at: now,
				id,
				// Mirrors what `createJobPosting` writes. A posting is born a draft and open;
				// neither field is in the payload, so the server cannot be told otherwise.
				is_closed: false,
				published_at: null,
				updated_at: now,
			},
			intents("website.createJobPosting"),
		);
		toastOnError(tx, "Failed to create job posting.");
		navigate({
			params: { postingId: id },
			to: "/website-management/job-postings/$postingId",
		});
	};

	return (
		<div>
			<PageHeader title="Create Job Posting" />
			<JobPostingForm
				defaultValues={{ content: {}, title: "" }}
				onSubmit={handleSubmit}
				submitLabel="Create"
			/>
		</div>
	);
}
