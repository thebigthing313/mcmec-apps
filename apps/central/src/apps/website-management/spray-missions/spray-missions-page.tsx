import { formatDateShort } from "@mcmec/lib/functions/date-fns";
import type { SprayScheduleStatus } from "@mcmec/schemas/db/spray-schedules";
import {
	RecordIndex,
	type RecordIndexColumn,
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
import { eq, useLiveQuery } from "@tanstack/react-db";
import { getRouteApi, Link } from "@tanstack/react-router";
import { Plus, SprayCan } from "lucide-react";
import { runLifecycle } from "@/src/apps/website-management/lib/lifecycle";
import { transitionsFrom } from "@/src/apps/website-management/lib/spray-mission-transitions";
import {
	formatTimeRange,
	statusBadgeVariant,
	statusLabel,
} from "@/src/apps/website-management/lib/spray-schedule";
import { MISSION_STATUSES } from "@/src/lib/website-management-search";

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

const route = getRouteApi("/(app)/website-management/spray-missions/");

export function SprayMissionsPage() {
	const {
		insecticides,
		municipalities,
		sprayScheduleMunicipalities,
		spraySchedules,
	} = route.useRouteContext();
	const navigate = route.useNavigate();
	const search = route.useSearch();

	const { data: schedules, collection } = useLiveQuery(
		(q) =>
			q
				.from({ schedule: spraySchedules })
				.innerJoin({ insecticide: insecticides }, ({ schedule, insecticide }) =>
					eq(schedule.insecticide_id, insecticide.id),
				)
				.select(({ schedule, insecticide }) => ({
					areaDescription: schedule.area_description,
					endTime: schedule.end_time,
					id: schedule.id,
					insecticideName: insecticide?.trade_name ?? "",
					missionDate: schedule.mission_date,
					startTime: schedule.start_time,
					status: schedule.status,
				})),
		[spraySchedules, insecticides],
	);

	// The junction syncs like any other collection, so a municipality write shows up here without
	// an invalidation step. Both it and `municipalities` are subscribed rather than read with a
	// one-shot `get()`, because the loader preloads them (src/lib/collections/registry.ts).
	const { data: links } = useLiveQuery(
		(q) => q.from({ link: sprayScheduleMunicipalities }),
		[sprayScheduleMunicipalities],
	);
	const { data: municipalityRows } = useLiveQuery(
		(q) => q.from({ municipality: municipalities }),
		[municipalities],
	);
	const municipalityName = new Map(
		municipalityRows.map((municipality) => [
			municipality.id,
			municipality.name,
		]),
	);

	const allRows: MissionRow[] = schedules.map((schedule) => ({
		...schedule,
		municipalityNames: links
			.filter((link) => link.spray_schedule_id === schedule.id)
			.map((link) => municipalityName.get(link.municipality_id))
			.filter((name): name is string => !!name)
			.sort()
			.join(", "),
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
				<Button
					onClick={() =>
						navigate({ to: "/website-management/spray-missions/create" })
					}
				>
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
							to: "/website-management/spray-missions",
						})
					}
					value={search.status ?? "all"}
				>
					<SelectTrigger aria-label="Filter by status" className="w-40">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All statuses</SelectItem>
						{MISSION_STATUSES.map((status) => (
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
					to: "/website-management/spray-missions",
				})
			}
			onSearchChange={(next) =>
				navigate({
					search: { ...search, ...next },
					to: "/website-management/spray-missions",
				})
			}
			renderRowLink={({ row, className, children }) => (
				<Link
					className={className}
					params={{ sprayScheduleId: row.id }}
					search={search}
					to="/website-management/spray-missions/$sprayScheduleId"
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
