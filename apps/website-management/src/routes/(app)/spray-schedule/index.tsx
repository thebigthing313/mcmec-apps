import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { Button } from "@mcmec/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { SprayScheduleTable } from "@/src/components/spray-schedule-table";
import { useSpraySchedules } from "@/src/hooks/use-spray-schedules";

export const Route = createFileRoute("/(app)/spray-schedule/")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Spray Missions" };
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { data: schedules } = useSpraySchedules();

	const tableData = schedules.map((schedule) => ({
		areaDescription: schedule.areaDescription,
		endTime: schedule.endTime,
		id: schedule.id,
		insecticideName: schedule.insecticideName ?? "",
		missionDate: schedule.missionDate,
		municipalityNames: schedule.municipalityNames,
		startTime: schedule.startTime,
		status: schedule.status,
	}));

	return (
		<div className="space-y-4">
			<PageHeader
				actions={
					<Button onClick={() => navigate({ to: "/spray-schedule/create" })}>
						<Plus />
						Create New Mission
					</Button>
				}
				title="Spray Missions"
			/>
			<SprayScheduleTable data={tableData} />
		</div>
	);
}
