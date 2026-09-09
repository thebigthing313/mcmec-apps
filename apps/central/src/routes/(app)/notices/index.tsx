import { formatDateShort } from "@mcmec/lib/functions/date-fns";
import { PublicNoticeBadge } from "@mcmec/ui/blocks/public-notice-badge";
import {
	RecordIndex,
	type RecordIndexColumn,
	type RecordIndexSearch,
	validateRecordIndexSearch,
} from "@mcmec/ui/blocks/record-index";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@mcmec/ui/components/select";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { notices, noticeTypes } from "@/src/lib/db";

type NoticeRow = {
	id: string;
	title: string;
	noticeType: string;
	noticeDate: Date;
	isArchived: boolean;
};

const PLACEMENTS = ["Current", "Archived"] as const;
type Placement = (typeof PLACEMENTS)[number];

type NoticesSearch = Partial<RecordIndexSearch> & { placement?: Placement };

export const Route = createFileRoute("/(app)/notices/")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Public Notices" };
	},
	validateSearch: (raw: Record<string, unknown>): NoticesSearch =>
		validateRecordIndexSearch(raw, (r) =>
			PLACEMENTS.includes(r.placement as Placement)
				? { placement: r.placement as Placement }
				: {},
		),
});

function RouteComponent() {
	const navigate = useNavigate();
	const search = Route.useSearch();
	const { data, collection } = useLiveQuery((q) =>
		q
			.from({ notice: notices })
			.innerJoin({ notice_type: noticeTypes }, ({ notice, notice_type }) =>
				eq(notice.notice_type_id, notice_type.id),
			)
			.select(({ notice, notice_type }) => ({
				id: notice.id,
				isArchived: notice.is_archived,
				isPublished: notice.is_published,
				noticeDate: notice.notice_date,
				noticeType: notice_type?.name,
				title: notice.title,
			})),
	);

	// The one rule this screen exists to keep: Central shows what the public sees, and nothing
	// else. The shape proxy hands any authenticated session the whole `notices` table, drafts
	// included (`shapes.ts`), because the policy is per-table and Website Management authors
	// against the same shape — so the narrowing happens here, once, in the open.
	//
	// `is_published` is the whole test. A published notice dated in the future is on the public
	// website today (`/notices` filters on `is_archived` alone), so it belongs on this list too;
	// its badge reads Pending, which is the word Website Management uses for the same state.
	const rows: NoticeRow[] = (data ?? [])
		.filter((notice) => notice.isPublished)
		.map((notice) => ({
			id: notice.id,
			isArchived: notice.isArchived,
			noticeDate: notice.noticeDate,
			noticeType: notice.noticeType,
			title: notice.title,
		}));

	// The two pages a resident can be looking at: Legal Notices, and Archived Notices.
	const visible = search.placement
		? rows.filter((row) => (search.placement === "Archived") === row.isArchived)
		: rows;

	const setPlacement = (next: Placement | undefined) =>
		navigate({
			search: { ...search, page: 1, placement: next },
			to: "/notices",
		});

	const columns: RecordIndexColumn<NoticeRow>[] = [
		{
			cell: (row) => row.title,
			// A statutory title runs long — "…Pursuant to N.J.S.A. 10:4-6 et seq." — and notices
			// on this register share their first clause. Truncating keeps the date and status on
			// screen; the date beside it is what actually tells them apart.
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
			// One badge component across the three applications that draw this state, so a notice
			// that reads Pending in Website Management does not read Published here.
			cell: (row) => (
				<PublicNoticeBadge
					isArchived={row.isArchived}
					isPublished={true}
					noticeDate={row.noticeDate}
				/>
			),
			header: "Status",
			id: "status",
			// Sorted on the word the badge actually shows, Pending included. A sort key that
			// disagreed with the cell would put two visibly different rows next to each other.
			sortValue: (row) =>
				row.isArchived
					? "Archived"
					: row.noticeDate > new Date()
						? "Pending"
						: "Published",
		},
	];

	return (
		<RecordIndex
			columns={columns}
			defaultSort={{ dir: "desc", id: "noticeDate" }}
			description="Every notice on the Commission's public website, current and archived."
			emptyState={{
				description:
					"Nothing is posted on the Commission's public notices pages.",
				icon: FileText,
				title: "No notices on the website",
			}}
			filters={
				<Select
					onValueChange={(value) =>
						setPlacement(value === "all" ? undefined : (value as Placement))
					}
					value={search.placement ?? "all"}
				>
					<SelectTrigger
						aria-label="Filter by where it appears"
						className="w-40"
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All notices</SelectItem>
						{PLACEMENTS.map((placement) => (
							<SelectItem key={placement} value={placement}>
								{placement}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			}
			filtersActive={search.placement !== undefined}
			getRowKey={(row) => row.id}
			getRowLabel={(row) => `${row.title}, ${formatDateShort(row.noticeDate)}`}
			getSearchText={(row) => `${row.title} ${row.noticeType}`}
			onClearFilters={() => setPlacement(undefined)}
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
					// notice's own Back link can hand them straight back.
					search={search}
					to="/notices/$noticeId"
				>
					{children}
				</Link>
			)}
			rows={visible}
			search={search}
			searchPlaceholder="Search notices"
			// Loading and empty are different screens. This register is a legal record, and
			// "nothing is published" must never be said by a table that is still syncing.
			state={collection.isReady() ? "ready" : "loading"}
			title="Public Notices"
			totalRows={rows.length}
		/>
	);
}
