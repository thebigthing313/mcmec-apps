import {
	RecordIndex,
	type RecordIndexColumn,
} from "@mcmec/ui/blocks/record-index";
import { Badge } from "@mcmec/ui/components/badge";
import { Button } from "@mcmec/ui/components/button";
import { useLiveQuery } from "@tanstack/react-db";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { CalendarClock, Plus } from "lucide-react";
import { staffEventWhen } from "./staff-event-details";
import { staffEventLifecycle } from "./staff-event-lifecycle";

type StaffEventRow = {
	id: string;
	title: string;
	when: string;
	startsOn: string;
	startTime: string | null;
	location: string | null;
	is_cancelled: boolean;
};

const route = getRouteApi("/(app)/hr/staff-events/");

/** `/hr/staff-events`: every Staff Event, newest first. */
export function StaffEventsPage() {
	const { staffEvents } = route.useRouteContext();
	const navigate = useNavigate();
	const search = route.useSearch();
	const { data, collection } = useLiveQuery(
		(q) => q.from({ event: staffEvents }),
		[staffEvents],
	);

	const rows: StaffEventRow[] = (data ?? []).map((event) => ({
		id: event.id,
		is_cancelled: event.is_cancelled,
		location: event.location,
		startTime: event.start_time,
		startsOn: event.starts_on,
		title: event.title,
		when: staffEventWhen(event),
	}));

	const columns: RecordIndexColumn<StaffEventRow>[] = [
		{
			cell: (row) => (
				<span className={row.is_cancelled ? "line-through" : undefined}>
					{row.title}
				</span>
			),
			cellClassName: "max-w-[36ch] truncate",
			header: "Event",
			id: "title",
			identity: true,
			sortValue: (row) => row.title,
		},
		{
			cell: (row) => <span className="tabular-nums">{row.when}</span>,
			header: "When",
			id: "startsOn",
			// ISO text sorts as the calendar does; all day first, then by time, within a day.
			sortValue: (row) => `${row.startsOn} ${row.startTime ?? ""}`,
		},
		{
			cell: (row) => (
				<span className="text-muted-foreground">{row.location ?? "—"}</span>
			),
			header: "Location",
			id: "location",
			sortValue: (row) => row.location,
		},
		{
			cell: (row) =>
				row.is_cancelled ? <Badge variant="secondary">Cancelled</Badge> : null,
			header: "Status",
			id: "status",
			sortValue: (row) => (row.is_cancelled ? 1 : 0),
		},
	];

	return (
		<RecordIndex
			actions={
				<Button onClick={() => navigate({ to: "/hr/staff-events/create" })}>
					<Plus />
					Add Staff Event
				</Button>
			}
			columns={columns}
			defaultSort={{ dir: "desc", id: "startsOn" }}
			description="Webinars, training dates and anything else every Employee should know about. They appear on the Calendar for every Employee, never on the public site."
			emptyState={{
				description:
					"Add an event and every Employee sees it on the Calendar. A training held on four days is four events.",
				icon: CalendarClock,
				title: "No Staff Events yet",
			}}
			getRowKey={(row) => row.id}
			getRowLabel={(row) =>
				`${row.title}, ${row.when}${row.is_cancelled ? ", cancelled" : ""}`
			}
			getSearchText={(row) => `${row.title} ${row.location ?? ""}`}
			onSearchChange={(next) =>
				navigate({ search: { ...search, ...next }, to: "/hr/staff-events" })
			}
			renderRowLink={({ row, className, children }) => (
				<Link
					className={className}
					params={{ staffEventId: row.id }}
					search={search}
					to="/hr/staff-events/$staffEventId"
				>
					{children}
				</Link>
			)}
			// A shortcut, never the only way in: Cancel Event and Reinstate are on the detail view
			// and the edit form too (ADR 0001). Delete is only in the detail page's danger zone.
			rowActions={(row) => {
				const action = staffEventLifecycle(staffEvents, row);
				return [
					{
						icon: action.icon,
						label: action.label,
						onAct: () => action.onAct(),
					},
				];
			}}
			rows={rows}
			search={search}
			searchPlaceholder="Search Staff Events"
			state={collection.isReady() ? "ready" : "loading"}
			title="Staff Events"
		/>
	);
}
