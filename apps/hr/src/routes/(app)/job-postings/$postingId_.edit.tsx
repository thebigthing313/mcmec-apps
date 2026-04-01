import { ErrorMessages } from "@mcmec/lib/constants/errors";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@mcmec/ui/components/alert-dialog";
import { Button } from "@mcmec/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import {
	JobPostingForm,
	type JobPostingFormValues,
} from "@/src/components/job-posting-form";
import { jobPostings } from "@/src/lib/db";

export const Route = createFileRoute("/(app)/job-postings/$postingId_/edit")({
	component: RouteComponent,
	loader: async ({ params }) => {
		await jobPostings.stateWhenReady();
		const posting = jobPostings.get(params.postingId);
		if (!posting) {
			throw new Error(ErrorMessages.DATABASE.RECORD_NOT_AVAILABLE);
		}
		return { crumb: "Edit", posting };
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { posting } = Route.useLoaderData();
	const { postingId } = Route.useParams();

	const handleSubmit = async (value: JobPostingFormValues) => {
		jobPostings.update(postingId, (draft) => {
			draft.title = value.title;
			draft.content = value.content;
			draft.published_at = value.published_at;
			draft.is_closed = value.is_closed;
		});
		navigate({ to: "/job-postings/$postingId", params: { postingId } });
	};

	const handleDelete = async () => {
		jobPostings.delete(postingId);
		navigate({ to: "/job-postings" });
	};

	return (
		<div className="space-y-4">
			<JobPostingForm
				defaultValues={{
					content: posting.content,
					is_closed: posting.is_closed,
					published_at: posting.published_at,
					title: posting.title,
				}}
				formLabel="Edit Job Posting"
				onSubmit={handleSubmit}
				submitLabel="Update"
			/>

			<div className="max-w-2xl">
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button className="w-full" variant="destructive">
							Delete Job Posting
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
							<AlertDialogDescription>
								This action cannot be undone. This will permanently delete the
								job posting "{posting.title}".
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction onClick={handleDelete}>
								Delete
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	);
}
