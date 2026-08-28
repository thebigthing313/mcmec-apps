import { formatDateShort } from "@mcmec/lib/functions/date-fns";
import {
	RecordIndex,
	type RecordIndexColumn,
	type RecordIndexSearch,
} from "@mcmec/ui/blocks/record-index";
import { Badge } from "@mcmec/ui/components/badge";
import { Button } from "@mcmec/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, SprayCan } from "lucide-react";
import { useSpraySchedules } from "@/src/hooks/use-spray-schedules";
import {
	formatTimeRange,
	statusBadgeVariant,
	statusLabel,
} from "@/src/lib/spray-schedule";

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
	validateSearch: (
		raw: Partial<Record<keyof RecordIndexSearch, unknown>>,
	): Partial<RecordIndexSearch> => ({
		...(typeof raw.q === "string" && raw.q ? { q: raw.q } : {}),
		...(Number(raw.page) > 1 ? { page: Number(raw.page) } : {}),
		...(Number(raw.size) ? { size: Number(raw.size) } : {}),
		...(typeof raw.sort === "string" && raw.sort ? { sort: raw.sort } : {}),
		...(raw.dir === "asc" || raw.dir === "desc" ? { dir: raw.dir } : {}),
	}),
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const search = Route.useSearch();
	const { data: schedules, collection } = useSpraySchedules();

	const rows: MissionRow[] = schedules.map((schedule) => ({
		areaDescription: schedule.areaDescription,
		endTime: schedule.endTime,
		id: schedule.id,
		insecticideName: schedule.insecticideName ?? "",
		missionDate: schedule.missionDate,
		municipalityNames: schedule.municipalityNames,
		startTime: schedule.startTime,
		status: schedule.status,
	}));

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
					Create New Mission
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
			getRowKey={(row) => row.id}
			getRowLabel={(row) =>
				`${row.areaDescription}, ${formatDateShort(row.missionDate)}`
			}
			getSearchText={(row) =>
				`${row.areaDescription} ${row.municipalityNames} ${row.insecticideName}`
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
					to="/spray-schedule/$sprayScheduleId"
				>
					{children}
				</Link>
			)}
			rows={rows}
			search={search}
			searchPlaceholder="Search missions"
			state={collection.isReady() ? "ready" : "loading"}
			title="Spray Missions"
		/>
	);
}
