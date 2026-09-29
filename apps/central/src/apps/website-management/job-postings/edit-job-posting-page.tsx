import type { CommandName } from "@mcmec/domain";
import { LifecycleButton } from "@mcmec/ui/blocks/lifecycle-button";
import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { rowVersion, useFormSeed } from "@mcmec/ui/hooks/use-form-seed";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { getRouteApi } from "@tanstack/react-router";
import {
	JobPostingForm,
	type JobPostingFormValues,
} from "@/src/apps/website-management/components/job-posting-form";
import {
	changedFields,
	type Draft,
	runLifecycle,
} from "@/src/apps/website-management/lib/lifecycle";
import type { CentralCollection } from "@/src/lib/collections";
import { intents } from "@/src/lib/intents";

const route = getRouteApi(
	"/(app)/website-management/job-postings/$postingId_/edit",
);

type JobPostingDraft = Draft<CentralCollection<"jobPostings">>;

export function EditJobPostingPage() {
	const { jobPostings } = route.useRouteContext();
	const navigate = route.useNavigate();
	const { posting: loadedPosting } = route.useLoaderData();
	const { postingId } = route.useParams();

	// Live rather than loader data: the lifecycle buttons below read `posting` to decide which
	// direction they act in, so they have to see their own optimistic update.
	const { data: livePostings } = useLiveQuery(
		(q) =>
			q
				.from({ posting: jobPostings })
				.where(({ posting }) => eq(posting.id, postingId)),
		[jobPostings, postingId],
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
		navigate({
			params: { postingId },
			to: "/website-management/job-postings/$postingId",
		});
	};

	return (
		<div className="space-y-4" {...latchProps}>
			<PageHeader title="Edit Job Posting" />
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
				key={seedKey}
				onSubmit={handleSubmit}
				submitLabel="Update"
			/>
		</div>
	);
}
