import { createFileRoute } from "@tanstack/react-router";
import {
	JobPostingForm,
	type JobPostingFormValues,
} from "@/src/components/job-posting-form";
import { jobPostings } from "@/src/lib/db";

export const Route = createFileRoute("/(app)/job-postings/new")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = Route.useNavigate();

	const handleSubmit = async (value: JobPostingFormValues) => {
		const id = crypto.randomUUID();
		jobPostings.insert({
			id,
			title: value.title,
			content: value.content,
			published_at: value.published_at,
			is_closed: value.is_closed,
			created_at: new Date(),
			updated_at: new Date(),
			created_by: null,
			updated_by: null,
		});
		navigate({ to: "/job-postings/$postingId", params: { postingId: id } });
	};

	return (
		<JobPostingForm
			defaultValues={{
				content: {},
				is_closed: false,
				published_at: null,
				title: "",
			}}
			formLabel="New Job Posting"
			onSubmit={handleSubmit}
			submitLabel="Create"
		/>
	);
}
