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
import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import {
	JobPostingForm,
	type JobPostingFormValues,
} from "@/src/components/job-posting-form";
import { intents, jobPostings } from "@/src/lib/db";
import { toastOnError } from "@/src/lib/toast-on-error";
import { rowVersion, useFormSeed } from "@/src/lib/use-form-seed";

export const Route = createFileRoute("/(app)/job-postings/$postingId_/edit")({
	component: RouteComponent,
	loader: async ({ params }) => {
		await jobPostings.preload();
		const posting = jobPostings.get(params.postingId);
		if (!posting) {
			throw new Error(ErrorMessages.DATABASE.RECORD_NOT_AVAILABLE);
		}
		return { crumb: "Edit", posting };
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { posting: loadedPosting } = Route.useLoaderData();
	const { postingId } = Route.useParams();

	// Live rather than loader data: the lifecycle buttons below read `posting` to decide which
	// direction they act in, so they have to see their own optimistic update.
	const { data: livePostings } = useLiveQuery(
		(q) =>
			q
				.from({ posting: jobPostings })
				.where(({ posting }) => eq(posting.id, postingId)),
		[postingId],
	);
	const posting = livePostings[0] ?? loadedPosting;

	// Seed from the live row, and re-seed when it changes until the user takes the form —
	// see use-form-seed.ts. `updateJobPostingDetails` sends the diff against the LIVE row,
	// so a stale seed writes itself back and silently reverts whatever changed meanwhile.
	const { seedKey, latchProps } = useFormSeed(rowVersion(posting));

	const handleSubmit = async (value: JobPostingFormValues) => {
		const tx = jobPostings.update(
			postingId,
			intents("website.updateJobPostingDetails"),
			(draft) => {
				draft.content = value.content;
				draft.title = value.title;
			},
		);
		toastOnError(tx, "Failed to update job posting.");
		navigate({ params: { postingId }, to: "/job-postings/$postingId" });
	};

	// The draft says what the user sees change; the intent says what they meant. The optimistic
	// timestamp is this client's clock and the committed one is the server's — they differ by
	// milliseconds and sync settles it. What matters is that no client can choose the value.
	const togglePublished = () => {
		const publishing = posting.published_at === null;
		const tx = jobPostings.update(
			postingId,
			intents(
				publishing
					? "website.publishJobPosting"
					: "website.unpublishJobPosting",
			),
			(draft) => {
				draft.published_at = publishing ? new Date() : null;
			},
		);
		toastOnError(
			tx,
			publishing
				? "Failed to publish job posting."
				: "Failed to unpublish job posting.",
		);
	};

	const toggleClosed = () => {
		const closing = !posting.is_closed;
		const tx = jobPostings.update(
			postingId,
			intents(closing ? "website.closeJobPosting" : "website.reopenJobPosting"),
			(draft) => {
				draft.is_closed = closing;
			},
		);
		toastOnError(
			tx,
			closing
				? "Failed to close job posting."
				: "Failed to reopen job posting.",
		);
	};

	const handleDelete = async () => {
		const tx = jobPostings.delete(
			postingId,
			intents("website.deleteJobPosting"),
		);
		toastOnError(tx, "Failed to delete job posting.");
		navigate({ to: "/job-postings" });
	};

	return (
		<div className="space-y-4" {...latchProps}>
			<JobPostingForm
				defaultValues={{ content: posting.content, title: posting.title }}
				formLabel="Edit Job Posting"
				key={seedKey}
				onSubmit={handleSubmit}
				submitLabel="Update"
			/>

			<div className="max-w-2xl space-y-2">
				<div className="flex gap-2">
					<Button
						className="flex-1"
						onClick={togglePublished}
						variant="outline"
					>
						{posting.published_at ? "Unpublish" : "Publish"}
					</Button>
					<Button className="flex-1" onClick={toggleClosed} variant="outline">
						{posting.is_closed ? "Reopen" : "Close"}
					</Button>
				</div>

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
