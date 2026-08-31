import { formatDateShort } from "@mcmec/lib/functions/date-fns";
import type { SprayScheduleStatus } from "@mcmec/schemas/db/spray-schedules";
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
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, SprayCan } from "lucide-react";
import { useSpraySchedules } from "@/src/hooks/use-spray-schedules";
import { spraySchedules } from "@/src/lib/db";
import { runLifecycle } from "@/src/lib/lifecycle";
import { transitionsFrom } from "@/src/lib/spray-mission-transitions";
import {
	formatTimeRange,
	statusBadgeVariant,
	statusLabel,
} from "@/src/lib/spray-schedule";

/**
 * The four states a mission can be in, in the order the season runs them.
 *
 * The filter earns its place on this register more than on any other: the work is seasonal, and
 * out of season the default newest-first sort opens on a wall of Completed missions with no way
 * to isolate the ones still Scheduled.
 */
const STATUSES: SprayScheduleStatus[] = [
	"scheduled",
	"delayed",
	"completed",
	"cancelled",
];

type MissionsSearch = Partial<RecordIndexSearch> & {
	status?: SprayScheduleStatus;
};

type MissionRow = {
	id: string;
	missionDate: Date;
	startTime: string;
	endTime: string;
	status: string;
	municipalityNames: string;
	insecticideName: string;
	areaDescription: string;
};

export const Route = createFileRoute("/(app)/spray-schedule/")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Spray Missions" };
	},
	validateSearch: (raw): MissionsSearch =>
		validateRecordIndexSearch(raw, (r) =>
			STATUSES.includes(r.status as SprayScheduleStatus)
				? { status: r.status as SprayScheduleStatus }
				: {},
		),
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const search = Route.useSearch();
	const { data: schedules, collection } = useSpraySchedules();

	const allRows: MissionRow[] = schedules.map((schedule) => ({
		areaDescription: schedule.areaDescription,
		endTime: schedule.endTime,
		id: schedule.id,
		insecticideName: schedule.insecticideName ?? "",
		missionDate: schedule.missionDate,
		municipalityNames: schedule.municipalityNames,
		startTime: schedule.startTime,
		status: schedule.status,
	}));

	const rows = search.status
		? allRows.filter((row) => row.status === search.status)
		: allRows;

	const columns: RecordIndexColumn<MissionRow>[] = [
		{
			// The area is what a mission *is* to the staff running it, and what a resident asks
			// about — "are you spraying my street tonight".
			cell: (row) => row.areaDescription,
			cellClassName: "max-w-[36ch] truncate",
			header: "Area",
			id: "areaDescription",
			identity: true,
			sortValue: (row) => row.areaDescription,
		},
		{
			cell: (row) => (
				<span className="font-medium tabular-nums">
					{formatDateShort(row.missionDate)}
				</span>
			),
			header: "Mission Date",
			id: "missionDate",
			sortValue: (row) => row.missionDate,
		},
		{
			cell: (row) => (
				<span className="tabular-nums">
					{formatTimeRange(row.startTime, row.endTime)}
				</span>
			),
			header: "Time",
			id: "time",
		},
		{
			cell: (row) => (
				<span className="text-muted-foreground">{row.municipalityNames}</span>
			),
			cellClassName: "max-w-[28ch] truncate",
			header: "Municipalities",
			id: "municipalityNames",
			sortValue: (row) => row.municipalityNames,
		},
		{
			cell: (row) => (
				<span className="text-muted-foreground">{row.insecticideName}</span>
			),
			header: "Insecticide",
			id: "insecticideName",
			sortValue: (row) => row.insecticideName,
		},
		{
			cell: (row) => (
				<Badge variant={statusBadgeVariant(row.status)}>
					{statusLabel(row.status)}
				</Badge>
			),
			header: "Status",
			id: "status",
			sortValue: (row) => row.status,
		},
	];

	return (
		<RecordIndex
			actions={
				<Button onClick={() => navigate({ to: "/spray-schedule/create" })}>
					<Plus />
					Create Spray Mission
				</Button>
			}
			columns={columns}
			defaultSort={{ dir: "desc", id: "missionDate" }}
			description="Scheduled adulticide missions, and the areas and products each one covers."
			emptyState={{
				description:
					"Missions scheduled here appear on the public spray schedule with their area, window and product.",
				icon: SprayCan,
				title: "No spray missions yet",
			}}
			filters={
				<Select
					onValueChange={(value) =>
						navigate({
							search: {
								...search,
								page: 1,
								status:
									value === "all" ? undefined : (value as SprayScheduleStatus),
							},
							to: "/spray-schedule",
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
								{statusLabel(status)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			}
			filtersActive={search.status !== undefined}
			getRowKey={(row) => row.id}
			getRowLabel={(row) =>
				`${row.areaDescription}, ${formatDateShort(row.missionDate)}`
			}
			getSearchText={(row) =>
				`${row.areaDescription} ${row.municipalityNames} ${row.insecticideName}`
			}
			onClearFilters={() =>
				navigate({
					search: { ...search, page: 1, status: undefined },
					to: "/spray-schedule",
				})
			}
			onSearchChange={(next) =>
				navigate({
					search: { ...search, ...next },
					to: "/spray-schedule",
				})
			}
			renderRowLink={({ row, className, children }) => (
				<Link
					className={className}
					params={{ sprayScheduleId: row.id }}
					search={search}
					to="/spray-schedule/$sprayScheduleId"
				>
					{children}
				</Link>
			)}
			// A shortcut, never the only way in: every transition is also on the detail view
			// (ADR 0001). Delay is deliberately absent — it collects the rain date a delayed
			// mission carries, and a row menu has nowhere to ask for one.
			rowActions={(row) => {
				const missionName = `${row.areaDescription} on ${formatDateShort(row.missionDate)}`;
				return transitionsFrom(row.status as SprayScheduleStatus)
					.filter((transition) => !transition.collectsRainDate)
					.map((transition) => ({
						...(transition.confirm
							? {
									confirm: {
										actionLabel: transition.confirm.actionLabel,
										description: transition.confirm.describe(missionName),
										title: transition.confirm.title,
									},
								}
							: {}),
						icon: transition.icon,
						label: transition.label,
						onAct: () =>
							runLifecycle(spraySchedules, row.id, {
								apply: (draft) => {
									draft.status = transition.to;
								},
								command: transition.command,
								failure: transition.failure,
								success: `${missionName} now shows as ${statusLabel(transition.to)} on the public spray schedule.`,
							}),
					}));
			}}
			rows={rows}
			search={search}
			searchPlaceholder="Search missions"
			state={collection.isReady() ? "ready" : "loading"}
			title="Spray Missions"
		/>
	);
}
