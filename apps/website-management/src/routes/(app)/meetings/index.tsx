import { formatDateTime } from "@mcmec/lib/functions/date-fns";
import {
	RecordIndex,
	type RecordIndexColumn,
	validateRecordIndexSearch,
} from "@mcmec/ui/blocks/record-index";
import type { RowAction } from "@mcmec/ui/blocks/row-actions-menu";
import { Badge } from "@mcmec/ui/components/badge";
import { Button } from "@mcmec/ui/components/button";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CalendarOff, CalendarPlus, Plus, Users } from "lucide-react";
import { meetings } from "@/src/lib/db";
import { runLifecycle } from "@/src/lib/lifecycle";

type MeetingRow = {
	id: string;
	name: string;
	meetingAt: Date;
	location: string;
	isCancelled: boolean;
	minutesUrl: string | null;
	noticeUrl: string | null;
};

import { meetingStatus } from "@/src/lib/meetings";

export const Route = createFileRoute("/(app)/meetings/")({
	component: RouteComponent,
	loader: () => {
		// "Meetings", matching the rail. The crumb used to read "Meetings Index", which is a
		// developer's word for a route, not the Commission's word for the thing.
		return { crumb: "Meetings" };
	},
	validateSearch: validateRecordIndexSearch,
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
								className="text-primary text-sm hover:underline"
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

	// A shortcut, never the only way in: cancelling is also on the detail view and in the edit
	// form (ADR 0001). Delete is not here and never can be — it lives in the danger zone on the
	// detail page. A cancel from a row carries no notes with it, so a meeting that has none is
	// refused here with the handler's own sentence, which is the same answer the detail view
	// gives.
	const rowActions = (meeting: MeetingRow): RowAction[] => [
		meeting.isCancelled
			? {
					icon: <CalendarPlus />,
					label: "Reinstate Meeting",
					onAct: () =>
						runLifecycle(meetings, meeting.id, {
							apply: (draft) => {
								draft.is_cancelled = false;
							},
							command: "website.uncancelMeeting",
							failure: "Failed to reinstate meeting.",
							success: `"${meeting.name}" is back on the public calendar.`,
						}),
				}
			: {
					// A cancellation is published to the public calendar the moment it lands, and
					// the Open Public Meetings Act is what makes that visible record matter.
					confirm: {
						actionLabel: "Cancel Meeting",
						description: `"${meeting.name}" will show as Cancelled on the public website. The meeting stays on the record — it is not removed.`,
						title: "Cancel this meeting publicly?",
					},
					icon: <CalendarOff />,
					label: "Cancel Meeting",
					onAct: () =>
						runLifecycle(meetings, meeting.id, {
							apply: (draft) => {
								draft.is_cancelled = true;
							},
							command: "website.cancelMeeting",
							failure: "Failed to cancel meeting.",
							success: `"${meeting.name}" now shows as Cancelled on the public site.`,
						}),
				},
	];

	return (
		<RecordIndex
			actions={
				<Button onClick={() => navigate({ to: "/meetings/create" })}>
					<Plus />
					Create Meeting
				</Button>
			}
			columns={columns}
			defaultSort={{ dir: "desc", id: "meetingAt" }}
			description="Commission meetings, their agendas and minutes, and any that were cancelled."
			emptyState={{
				description:
					"Meetings published here appear on the public calendar with their agendas and minutes.",
				icon: Users,
				title: "No meetings yet",
			}}
			getRowKey={(row) => row.id}
			getRowLabel={(row) => `${row.name}, ${formatDateTime(row.meetingAt)}`}
			getSearchText={(row) => `${row.name} ${row.location}`}
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
					to="/meetings/$meetingId"
				>
					{children}
				</Link>
			)}
			rowActions={rowActions}
			rows={rows}
			search={search}
			searchPlaceholder="Search meetings"
			state={collection.isReady() ? "ready" : "loading"}
			title="Meetings"
		/>
	);
}
