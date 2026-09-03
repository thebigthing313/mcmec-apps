import { formatDateTime } from "@mcmec/lib/functions/date-fns";
import { meetingStatus } from "@mcmec/lib/functions/meeting-status";
import {
	RecordIndex,
	type RecordIndexColumn,
	type RecordIndexSearch,
	validateRecordIndexSearch,
} from "@mcmec/ui/blocks/record-index";
import { Badge } from "@mcmec/ui/components/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@mcmec/ui/components/select";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { meetings } from "@/src/lib/db";

type MeetingRow = {
	id: string;
	name: string;
	meetingAt: Date;
	location: string;
	isCancelled: boolean;
	minutesUrl: string | null;
	noticeUrl: string | null;
};

const ALL_YEARS = "all";

type MeetingsSearch = Partial<RecordIndexSearch> & { year?: string };

export const Route = createFileRoute("/(app)/meetings/")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Public Meetings" };
	},
	validateSearch: (raw: Record<string, unknown>): MeetingsSearch =>
		validateRecordIndexSearch(raw, (r) =>
			typeof r.year === "string" && /^(all|\d{4})$/.test(r.year)
				? { year: r.year }
				: {},
		),
});

function RouteComponent() {
	const navigate = useNavigate();
	const search = Route.useSearch();
	const { data, collection } = useLiveQuery((q) =>
		q.from({ meeting: meetings }),
	);

	const rows: MeetingRow[] = (data ?? []).map((meeting) => ({
		id: meeting.id,
		isCancelled: meeting.is_cancelled,
		location: meeting.location,
		meetingAt: meeting.meeting_at,
		minutesUrl: meeting.minutes_url,
		name: meeting.name,
		noticeUrl: meeting.notice_url,
	}));

	const years = [
		...new Set(rows.map((row) => row.meetingAt.getFullYear())),
	].sort((a, b) => b - a);

	// The register holds the whole record — the public page's own windowing is a presentation
	// choice made for residents, not a limit on what staff may look up — so a year is how it is
	// read, one season at a time.
	//
	// The default is the most recent year that HAS meetings rather than the current calendar
	// year. In practice they are the same value; the difference is January, when a fixed
	// `getFullYear()` would open this screen on an empty table and make a full record look like
	// a missing one.
	const defaultYear = years[0] ? `${years[0]}` : ALL_YEARS;
	const year = search.year ?? defaultYear;
	const visible =
		year === ALL_YEARS
			? rows
			: rows.filter((row) => `${row.meetingAt.getFullYear()}` === year);

	const setYear = (next: string) =>
		navigate({
			search: { ...search, page: 1, year: next },
			to: "/meetings",
		});

	const columns: RecordIndexColumn<MeetingRow>[] = [
		{
			cell: (row) => row.name,
			cellClassName: "max-w-[32ch] truncate",
			header: "Meeting",
			id: "name",
			identity: true,
			sortValue: (row) => row.name,
		},
		{
			cell: (row) => (
				<span className="tabular-nums">{formatDateTime(row.meetingAt)}</span>
			),
			header: "When",
			id: "meetingAt",
			sortValue: (row) => row.meetingAt,
		},
		{
			cell: (row) => (
				<span className="text-muted-foreground">{row.location}</span>
			),
			header: "Location",
			id: "location",
			sortValue: (row) => row.location,
		},
		{
			cell: (row) => {
				const status = meetingStatus(row);
				return <Badge variant={status.variant}>{status.label}</Badge>;
			},
			header: "Status",
			id: "status",
			sortValue: (row) => meetingStatus(row).label,
		},
		{
			// The two documents the Open Public Meetings Act is actually about. They are the
			// reason an employee opens this screen at all, so they are on the row rather than
			// one click further in — and they are the same files the public downloads.
			cell: (row) => {
				const links = [
					{ label: "Minutes", url: row.minutesUrl },
					{ label: "48-Hour Notice", url: row.noticeUrl },
				].filter((link) => link.url);
				if (links.length === 0) {
					return <span className="text-muted-foreground">—</span>;
				}
				return (
					<div className="flex flex-wrap gap-2">
						{links.map((link) => (
							<a
								className="rounded-sm text-primary text-sm hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
								href={link.url as string}
								key={link.label}
								rel="noopener noreferrer"
								target="_blank"
							>
								{link.label}
							</a>
						))}
					</div>
				);
			},
			header: "Documents",
			id: "links",
		},
	];

	return (
		<RecordIndex
			columns={columns}
			defaultSort={{ dir: "desc", id: "meetingAt" }}
			description="The Commission's public meeting calendar, with each meeting's 48-hour notice and minutes."
			emptyState={{
				description: "The Commission's public calendar has no meetings on it.",
				icon: CalendarDays,
				title: "No meetings on the calendar",
			}}
			filters={
				<Select onValueChange={setYear} value={year}>
					<SelectTrigger aria-label="Filter by year" className="w-36">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL_YEARS}>All years</SelectItem>
						{years.map((value) => (
							<SelectItem key={value} value={`${value}`}>
								{value}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			}
			filtersActive={year !== ALL_YEARS}
			getRowKey={(row) => row.id}
			getRowLabel={(row) => `${row.name}, ${formatDateTime(row.meetingAt)}`}
			getSearchText={(row) => `${row.name} ${row.location}`}
			// Clearing widens to the whole record rather than back to the default year: "Clear"
			// that re-narrows would be the one control on the screen that does not do what it says.
			onClearFilters={() => setYear(ALL_YEARS)}
			onSearchChange={(next) =>
				navigate({
					search: { ...search, ...next },
					to: "/meetings",
				})
			}
			renderRowLink={({ row, className, children }) => (
				<Link
					className={className}
					params={{ meetingId: row.id }}
					search={search}
					to="/meetings/$meetingId"
				>
					{children}
				</Link>
			)}
			rows={visible}
			search={search}
			searchPlaceholder="Search meetings"
			// Loading and empty are different screens. This register is a legal record, and
			// "there are no meetings" must never be said by a table that is still syncing.
			state={collection.isReady() ? "ready" : "loading"}
			title="Public Meetings"
			// The whole calendar, so the year filter's count reads "13 of 137" rather than
			// "13 of 13" — the rows above have already been narrowed to the selected year.
			totalRows={rows.length}
		/>
	);
}
