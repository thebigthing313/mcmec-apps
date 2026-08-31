import {
	formatDateShort,
	getTodayUTC,
	isOnOrBeforeDay,
} from "@mcmec/lib/functions/date-fns";
import {
	RecordIndex,
	type RecordIndexColumn,
	type RecordIndexSearch,
	validateRecordIndexSearch,
} from "@mcmec/ui/blocks/record-index";
import { Badge } from "@mcmec/ui/components/badge";
import { Button } from "@mcmec/ui/components/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@mcmec/ui/components/select";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FileText, Plus, Undo2, Upload } from "lucide-react";
import { useNotices } from "@/src/hooks/use-notices";
import { notices } from "@/src/lib/db";
import { runLifecycle } from "@/src/lib/lifecycle";

type NoticeRow = {
	id: string;
	title: string;
	noticeType: string;
	noticeDate: Date;
	isPublished: boolean;
	isArchived: boolean;
};

const STATUSES = ["Draft", "Pending", "Published", "Archived"] as const;
type Status = (typeof STATUSES)[number];

type NoticesSearch = Partial<RecordIndexSearch> & { status?: Status };

/**
 * A Notice's state, derived rather than stored, and always returned as a word.
 *
 * "Pending" is the one that needs saying out loud: a Notice can be Published against a future
 * date, in which case it is committed but not yet on the public site. The badge alone never
 * explained that, so the status filter below lists it as a first-class choice and the empty
 * state names it — the term now appears somewhere a reader can meet it.
 */
function publicationStatus(row: NoticeRow): {
	label: Status;
	variant: "default" | "secondary" | "outline";
} {
	if (!row.isPublished) return { label: "Draft", variant: "outline" };
	if (!isOnOrBeforeDay(row.noticeDate, getTodayUTC())) {
		return { label: "Pending", variant: "secondary" };
	}
	return row.isArchived
		? { label: "Archived", variant: "secondary" }
		: { label: "Published", variant: "default" };
}

export const Route = createFileRoute("/(app)/notices/")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Public Notices" };
	},
	// Sort, page, size, search and status now live in the URL. Returning from a notice used to
	// drop you on page one with the default sort, which on a register you work through one record
	// at a time is the difference between a tool and a treadmill.
	//
	// Every input is optional so that `to: "/notices"` from anywhere else still needs no search
	// object; the validator fills the defaults in.
	validateSearch: (raw: Record<string, unknown>): NoticesSearch =>
		validateRecordIndexSearch(raw, (r) =>
			STATUSES.includes(r.status as Status)
				? { status: r.status as Status }
				: {},
		),
});

function RouteComponent() {
	const navigate = useNavigate();
	const search = Route.useSearch();
	const { data: noticeList, collection } = useNotices();

	const rows: NoticeRow[] = (noticeList ?? []).map((notice) => ({
		id: notice.id,
		isArchived: notice.isArchived,
		isPublished: notice.isPublished,
		noticeDate: notice.noticeDate,
		noticeType: notice.noticeType,
		title: notice.title,
	}));

	const visible = search.status
		? rows.filter((row) => publicationStatus(row).label === search.status)
		: rows;

	const columns: RecordIndexColumn<NoticeRow>[] = [
		{
			cell: (row) => row.title,
			// A statutory title runs long — "…Pursuant to N.J.S.A. 10:4-6 et seq." — and three
			// notices on this register share the same first clause. Truncating keeps the Status
			// and action columns on screen; the date beside it is what actually tells them apart.
			cellClassName: "max-w-[42ch] truncate",
			header: "Title",
			id: "title",
			identity: true,
			sortValue: (row) => row.title,
		},
		{
			cell: (row) => (
				<span className="text-muted-foreground">{row.noticeType}</span>
			),
			header: "Notice Type",
			id: "noticeType",
			sortValue: (row) => row.noticeType,
		},
		{
			// The disambiguating field on this dataset, so it carries weight and tabular figures
			// rather than sitting third in the same grey as everything else.
			cell: (row) => (
				<span className="font-medium tabular-nums">
					{formatDateShort(row.noticeDate)}
				</span>
			),
			header: "Notice Date",
			id: "noticeDate",
			sortValue: (row) => row.noticeDate,
		},
		{
			cell: (row) => {
				const status = publicationStatus(row);
				return <Badge variant={status.variant}>{status.label}</Badge>;
			},
			header: "Status",
			id: "status",
			sortValue: (row) => publicationStatus(row).label,
		},
	];

	return (
		<RecordIndex
			actions={
				<Button onClick={() => navigate({ to: "/notices/create" })}>
					<Plus />
					Create Notice
				</Button>
			}
			columns={columns}
			defaultSort={{ dir: "desc", id: "noticeDate" }}
			description="Dated public announcements, including the legal notices the Commission is required to post."
			emptyState={{
				description:
					"Published notices appear on the public website; drafts stay here until you publish them.",
				icon: FileText,
				title: "No notices yet",
			}}
			filters={
				<Select
					onValueChange={(value) =>
						navigate({
							search: {
								...search,
								page: 1,
								status: value === "all" ? undefined : (value as Status),
							},
							to: "/notices",
						})
					}
					value={search.status ?? "all"}
				>
					<SelectTrigger aria-label="Filter by status" className="w-40">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All statuses</SelectItem>
						{STATUSES.map((status) => (
							<SelectItem key={status} value={status}>
								{status}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			}
			filtersActive={search.status !== undefined}
			getRowKey={(row) => row.id}
			getRowLabel={(row) => `${row.title}, ${formatDateShort(row.noticeDate)}`}
			getSearchText={(row) => `${row.title} ${row.noticeType}`}
			onClearFilters={() =>
				navigate({
					search: { ...search, page: 1, status: undefined },
					to: "/notices",
				})
			}
			onSearchChange={(next) =>
				navigate({
					search: { ...search, ...next },
					to: "/notices",
				})
			}
			renderRowLink={({ row, className, children }) => (
				<Link
					className={className}
					params={{ noticeId: row.id }}
					// The index's sort, page, search and filter ride along to the record, so the
					// detail page's own Back link can hand them straight back. Working a register
					// one record at a time is exactly the workflow RecordIndex round-trips state
					// for, and the most obvious control on the record was discarding it.
					search={search}
					to="/notices/$noticeId"
				>
					{children}
				</Link>
			)}
			// A shortcut, never the only way in: publishing is also on the detail view and in the
			// edit form (ADR 0001). Archive stays off the row — it is the one action that can be
			// refused, and the 409 reads better next to the notice it is about.
			rowActions={(notice) => [
				notice.isPublished
					? {
							// Unpublishing takes a posted legal notice off the public website. It
							// asks first and says so afterwards, because the effect lands somewhere
							// the person doing it is not looking.
							confirm: {
								actionLabel: "Unpublish",
								description: `"${notice.title}" will be removed from the public website immediately. It stays here and can be published again.`,
								title: "Remove this notice from the public site?",
							},
							icon: <Undo2 />,
							label: "Unpublish",
							onAct: () =>
								runLifecycle(notices, notice.id, {
									apply: (draft) => {
										draft.is_published = false;
									},
									command: "website.unpublishNotice",
									failure: "Failed to unpublish notice.",
									success: `"${notice.title}" is no longer on the public site.`,
								}),
						}
					: {
							icon: <Upload />,
							label: "Publish",
							onAct: () =>
								runLifecycle(notices, notice.id, {
									apply: (draft) => {
										draft.is_published = true;
									},
									command: "website.publishNotice",
									failure: "Failed to publish notice.",
									success: `"${notice.title}" is now on the public site.`,
								}),
						},
			]}
			rows={visible}
			search={search}
			searchPlaceholder="Search notices"
			// Loading and empty are different screens. This register is a legal record, and
			// "there are no notices" must never be said by a table that is still syncing.
			state={collection.isReady() ? "ready" : "loading"}
			title="Public Notices"
		/>
	);
}
