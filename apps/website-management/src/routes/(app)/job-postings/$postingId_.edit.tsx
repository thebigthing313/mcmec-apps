import type { CommandName } from "@mcmec/domain";
import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { LifecycleButton } from "@mcmec/ui/blocks/lifecycle-button";
import { rowVersion, useFormSeed } from "@mcmec/ui/hooks/use-form-seed";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import {
	JobPostingForm,
	type JobPostingFormValues,
} from "@/src/components/job-posting-form";
import { intents, jobPostings } from "@/src/lib/db";
import { changedFields, type Draft, runLifecycle } from "@/src/lib/lifecycle";

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

type JobPostingDraft = Draft<typeof jobPostings>;

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
	// see @mcmec/ui/hooks/use-form-seed. `updateJobPostingDetails` sends the diff against the LIVE row,
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

	return (
		<div className="space-y-4" {...latchProps}>
			<JobPostingForm
				actions={({ values }) => {
					// Diffed against the LIVE row, so the label and the payload cannot disagree:
					// if this is empty the button stays "Publish" and sends one intent, and
					// `updateJobPostingDetails` is never handed a payload its own non-empty
					// refinement would refuse.
					const changes = changedFields(values, posting);
					const isDirty = Object.keys(changes).length > 0;

					// One request, both intents, one transaction — so a refused lifecycle command
					// takes the field save back with it, which is what `savedTogether` says.
					const act =
						(
							command: CommandName,
							apply: (draft: JobPostingDraft) => void,
							failure: string,
						) =>
						(withSave: boolean) =>
							runLifecycle(jobPostings, postingId, {
								apply,
								command,
								failure,
								save: withSave
									? { changes, command: "website.updateJobPostingDetails" }
									: undefined,
							});

					// The optimistic timestamp is this client's clock and the committed one is the
					// server's — they differ by milliseconds and sync settles it. What matters is
					// that no client can choose the value.
					const publish = posting.published_at
						? {
								label: "Unpublish",
								onAct: act(
									"website.unpublishJobPosting",
									(draft) => {
										draft.published_at = null;
									},
									"Failed to unpublish job posting.",
								),
							}
						: {
								label: "Publish",
								onAct: act(
									"website.publishJobPosting",
									(draft) => {
										draft.published_at = new Date();
									},
									"Failed to publish job posting.",
								),
							};

					const close = posting.is_closed
						? {
								label: "Reopen",
								onAct: act(
									"website.reopenJobPosting",
									(draft) => {
										draft.is_closed = false;
									},
									"Failed to reopen job posting.",
								),
							}
						: {
								label: "Close",
								onAct: act(
									"website.closeJobPosting",
									(draft) => {
										draft.is_closed = true;
									},
									"Failed to close job posting.",
								),
							};

					return (
						<div className="flex gap-2">
							{[publish, close].map(({ label, onAct }) => (
								<LifecycleButton
									className="flex-1"
									isDirty={isDirty}
									key={label}
									label={label}
									onAct={onAct}
								/>
							))}
						</div>
					);
				}}
				defaultValues={{ content: posting.content, title: posting.title }}
				formLabel="Edit Job Posting"
				key={seedKey}
				onSubmit={handleSubmit}
				submitLabel="Update"
			/>
		</div>
	);
}
