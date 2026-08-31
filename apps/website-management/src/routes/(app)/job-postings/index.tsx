import { formatDateShort } from "@mcmec/lib/functions/date-fns";
import {
	getJobPostingStatus,
	type JobPostingStatus,
} from "@mcmec/lib/functions/job-posting-status";
import {
	RecordIndex,
	type RecordIndexColumn,
	validateRecordIndexSearch,
} from "@mcmec/ui/blocks/record-index";
import { Badge } from "@mcmec/ui/components/badge";
import { Button } from "@mcmec/ui/components/button";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, Plus, Undo2, Upload } from "lucide-react";
import { jobPostings } from "@/src/lib/db";
import { runLifecycle } from "@/src/lib/lifecycle";

type JobPostingRow = {
	id: string;
	is_closed: boolean;
	published_at: Date | null;
	title: string;
};

/**
 * Refusal Red is reserved for destructive commands and validation failures (DESIGN.md), and a
 * Closed posting is neither — it is the ordinary end of a hiring round. It previously rendered
 * `destructive`, which spent the system's one alarm colour on a routine state.
 */
const statusDisplay: Record<
	JobPostingStatus,
	{ label: string; variant: "default" | "outline" | "secondary" }
> = {
	closed: { label: "Closed", variant: "secondary" },
	draft: { label: "Draft", variant: "outline" },
	pending: { label: "Pending", variant: "secondary" },
	published: { label: "Published", variant: "default" },
};

export const Route = createFileRoute("/(app)/job-postings/")({
	component: JobPostingsPage,
	loader: () => ({ crumb: "Job Postings" }),
	validateSearch: validateRecordIndexSearch,
});

function JobPostingsPage() {
	const navigate = Route.useNavigate();
	const search = Route.useSearch();
	const { data: postingList, collection } = useLiveQuery((q) =>
		q.from({ posting: jobPostings }).select(({ posting }) => ({
			id: posting.id,
			is_closed: posting.is_closed,
			published_at: posting.published_at,
			title: posting.title,
		})),
	);

	const rows: JobPostingRow[] = postingList ?? [];

	const columns: RecordIndexColumn<JobPostingRow>[] = [
		{
			cell: (row) => row.title,
			cellClassName: "max-w-[42ch] truncate",
			header: "Title",
			id: "title",
			identity: true,
			sortValue: (row) => row.title,
		},
		{
			cell: (row) =>
				row.published_at ? (
					<span className="tabular-nums">
						{formatDateShort(row.published_at)}
					</span>
				) : (
					<span className="text-muted-foreground">—</span>
				),
			header: "Published",
			id: "published_at",
			sortValue: (row) => row.published_at,
		},
		{
			cell: (row) => {
				const status = statusDisplay[getJobPostingStatus(row)];
				return <Badge variant={status.variant}>{status.label}</Badge>;
			},
			header: "Status",
			id: "status",
			sortValue: (row) => statusDisplay[getJobPostingStatus(row)].label,
		},
	];

	return (
		<RecordIndex
			actions={
				<Button asChild>
					<Link to="/job-postings/new">
						<Plus />
						Add Job Posting
					</Link>
				</Button>
			}
			columns={columns}
			defaultSort={{ dir: "desc", id: "published_at" }}
			description="Create and manage job postings for the public website."
			emptyState={{
				description:
					"Published postings appear on the public careers page until they are closed.",
				icon: Briefcase,
				title: "No job postings yet",
			}}
			getRowKey={(row) => row.id}
			getRowLabel={(row) => row.title}
			getSearchText={(row) => row.title}
			onSearchChange={(next) =>
				navigate({
					search: { ...search, ...next },
					to: "/job-postings",
				})
			}
			renderRowLink={({ row, className, children }) => (
				<Link
					className={className}
					params={{ postingId: row.id }}
					to="/job-postings/$postingId"
				>
					{children}
				</Link>
			)}
			// A shortcut, never the only way in: publishing is also on the detail view and in the
			// edit form (ADR 0001). Close/Reopen stays off the row — closing a posting is the end
			// of a hiring round and reads as a decision, not a one-click toggle in a list.
			rowActions={(posting) => [
				posting.published_at
					? {
							confirm: {
								actionLabel: "Unpublish",
								description: `"${posting.title}" will be removed from the public careers page immediately. Applicants will no longer be able to find it.`,
								title: "Remove this posting from the public site?",
							},
							icon: <Undo2 />,
							label: "Unpublish",
							onAct: () =>
								runLifecycle(jobPostings, posting.id, {
									apply: (draft) => {
										draft.published_at = null;
									},
									command: "website.unpublishJobPosting",
									failure: "Failed to unpublish job posting.",
									success: `"${posting.title}" is no longer on the public careers page.`,
								}),
						}
					: {
							icon: <Upload />,
							label: "Publish",
							onAct: () =>
								runLifecycle(jobPostings, posting.id, {
									apply: (draft) => {
										draft.published_at = new Date();
									},
									command: "website.publishJobPosting",
									failure: "Failed to publish job posting.",
									success: `"${posting.title}" is now on the public careers page.`,
								}),
						},
			]}
			rows={rows}
			search={search}
			searchPlaceholder="Search job postings"
			state={collection.isReady() ? "ready" : "loading"}
			title="Job Postings"
		/>
	);
}
