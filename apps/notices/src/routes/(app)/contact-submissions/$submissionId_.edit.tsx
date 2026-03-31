import type { ContactFormSubmissionsRowType } from "@mcmec/supabase/db/contact-form-submissions";
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
import { ContactSubmissionForm } from "@/src/components/contact-submission-form";
import { toastOnError } from "@/src/lib/toast-on-error";

export const Route = createFileRoute(
	"/(app)/contact-submissions/$submissionId_/edit",
)({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Edit" };
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { db } = Route.useRouteContext();
	const { submissionId } = Route.useParams();

	const { data: submission } = useLiveQuery(
		(q) =>
			q
				.from({ s: db.contactFormSubmissions })
				.where(({ s }) => eq(s.id, submissionId))
				.findOne(),
		[submissionId],
	);

	if (!submission) {
		return null;
	}

	const handleSubmit = async (value: ContactFormSubmissionsRowType) => {
		const tx = db.contactFormSubmissions.update(submissionId, (draft) => {
			Object.assign(draft, value);
		});
		toastOnError(tx, "Failed to update submission.");
		navigate({ to: "/contact-submissions" });
	};

	const handleDelete = async () => {
		const tx = db.contactFormSubmissions.delete(submissionId);
		toastOnError(tx, "Failed to delete submission.");
		navigate({ to: "/contact-submissions" });
	};

	const handleToggleClosed = async () => {
		const tx = db.contactFormSubmissions.update(submissionId, (draft) => {
			draft.is_closed = !draft.is_closed;
		});
		toastOnError(tx, "Failed to update submission status.");
	};

	return (
		<div className="space-y-4">
			<div className="max-w-2xl">
				<Button
					className="w-full"
					onClick={handleToggleClosed}
					variant={submission.is_closed ? "outline" : "default"}
				>
					{submission.is_closed ? "Reopen Submission" : "Close Submission"}
				</Button>
			</div>

			<ContactSubmissionForm
				defaultValues={{
					created_at: new Date(submission.created_at),
					created_by: submission.created_by,
					email: submission.email,
					id: submission.id,
					is_closed: submission.is_closed,
					message: submission.message,
					name: submission.name,
					subject: submission.subject,
					updated_at: new Date(),
					updated_by: null,
				}}
				formLabel="Edit Contact Submission"
				onSubmit={handleSubmit}
				submitLabel="Update"
			/>

			<div className="max-w-2xl">
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button className="w-full" variant="destructive">
							Delete Submission
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
							<AlertDialogDescription>
								This action cannot be undone. This will permanently delete the
								submission from {submission.name}.
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
