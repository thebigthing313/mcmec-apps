import { formatDateShort } from "@mcmec/lib/functions/date-fns";
import { getJobPostingStatus } from "@mcmec/lib/functions/job-posting-status";
import { DangerZoneCard } from "@mcmec/ui/blocks/danger-zone-card";
import { LifecycleButton } from "@mcmec/ui/blocks/lifecycle-button";
import { RecordDetail } from "@mcmec/ui/blocks/record-detail";
import { TiptapRenderer } from "@mcmec/ui/blocks/tiptap-renderer";
import { Badge } from "@mcmec/ui/components/badge";
import { Button } from "@mcmec/ui/components/button";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { eq, useLiveQuery } from "@tanstack/react-db";
import {
	createFileRoute,
	Link,
	notFound,
	useNavigate,
} from "@tanstack/react-router";
import {
	ArrowLeft,
	DoorClosed,
	DoorOpen,
	Edit,
	Undo2,
	Upload,
} from "lucide-react";
import { intents, jobPostings } from "@/src/lib/db";
import { JOB_POSTING_STATUS_DISPLAY } from "@/src/lib/job-postings";
import { runLifecycle } from "@/src/lib/lifecycle";

export const Route = createFileRoute("/(app)/job-postings/$postingId")({
	component: RouteComponent,
	loader: async ({ params }) => {
		await jobPostings.preload();
		const posting = jobPostings.get(params.postingId);
		if (!posting) {
			throw notFound();
		}
		return { crumb: posting.title };
	},
});

function RouteComponent() {
	const { postingId } = Route.useParams();
	const navigate = useNavigate();

	// Live, so returning from a Publish or Close on the edit screen shows the new status rather
	// than the one the loader captured.
	const { data: posting } = useLiveQuery((q) =>
		q
			.from({ posting: jobPostings })
			.where(({ posting }) => eq(posting.id, postingId))
			.findOne(),
	);

	if (!posting) return null;

	const status = JOB_POSTING_STATUS_DISPLAY[getJobPostingStatus(posting)];

	// This is the table that motivated ADR 0001: publishing and closing were reachable only
	// from inside the edit form, where they were indistinguishable from editing. No form under
	// these, so no `isDirty` and no relabel — one click, one intent.
	const publish = posting.published_at
		? {
				icon: <Undo2 />,
				label: "Unpublish",
				onAct: () =>
					runLifecycle(jobPostings, postingId, {
						apply: (draft) => {
							draft.published_at = null;
						},
						command: "website.unpublishJobPosting",
						failure: "Failed to unpublish job posting.",
					}),
			}
		: {
				icon: <Upload />,
				label: "Publish",
				onAct: () =>
					runLifecycle(jobPostings, postingId, {
						apply: (draft) => {
							draft.published_at = new Date();
						},
						command: "website.publishJobPosting",
						failure: "Failed to publish job posting.",
					}),
			};

	const close = posting.is_closed
		? {
				icon: <DoorOpen />,
				label: "Reopen",
				onAct: () =>
					runLifecycle(jobPostings, postingId, {
						apply: (draft) => {
							draft.is_closed = false;
						},
						command: "website.reopenJobPosting",
						failure: "Failed to reopen job posting.",
					}),
			}
		: {
				icon: <DoorClosed />,
				label: "Close",
				onAct: () =>
					runLifecycle(jobPostings, postingId, {
						apply: (draft) => {
							draft.is_closed = true;
						},
						command: "website.closeJobPosting",
						failure: "Failed to close job posting.",
					}),
			};

	// Detail page only, danger zone, behind a confirm — ADR 0001's one exception to free
	// placement. It leaves the page because the record it was showing is gone.
	const handleDelete = () => {
		const tx = jobPostings.delete(
			postingId,
			intents("website.deleteJobPosting"),
		);
		toastOnError(tx, "Failed to delete job posting.");
		navigate({ to: "/job-postings" });
	};

	return (
		<RecordDetail
			actions={
				<>
					<Button asChild size="sm" variant="outline">
						<Link params={{ postingId }} to="/job-postings/$postingId/edit">
							<Edit />
							Edit
						</Link>
					</Button>
					{[publish, close].map(({ icon, label, onAct }) => (
						<LifecycleButton
							icon={icon}
							key={label}
							label={label}
							onAct={onAct}
							size="sm"
						/>
					))}
				</>
			}
			backLink={
				<Button asChild size="sm" variant="outline">
					<Link to="/job-postings">
						<ArrowLeft />
						Back to Job Postings
					</Link>
				</Button>
			}
			badge={<Badge variant={status.variant}>{status.label}</Badge>}
			danger={
				<DangerZoneCard
					label="Delete Job Posting"
					onConfirm={handleDelete}
					recordName={posting.title}
				/>
			}
			// "Closed: Yes" sat beside a badge already reading Closed, and Created/Updated were
			// row bookkeeping no other detail page shows. What is left is the one date a reader
			// cannot get from the badge — and it is formatted like every other date in the product
			// rather than by a raw toLocaleDateString this page alone was calling.
			fields={[
				{
					label: "Published",
					value: posting.published_at
						? formatDateShort(posting.published_at)
						: "Not published",
				},
			]}
			title={posting.title}
		>
			<TiptapRenderer className="prose" content={posting.content} />
		</RecordDetail>
	);
}
