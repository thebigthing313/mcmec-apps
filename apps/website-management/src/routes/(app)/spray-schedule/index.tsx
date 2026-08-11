import { Button } from "@mcmec/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { SprayScheduleTable } from "@/src/components/spray-schedule-table";
import { useSpraySchedules } from "@/src/hooks/use-spray-schedules";

export const Route = createFileRoute("/(app)/spray-schedule/")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Spray Schedule" };
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
			<div className="flex items-center justify-between">
				<h1 className="font-semibold text-2xl">Spray Schedule</h1>
				<Button onClick={() => navigate({ to: "/spray-schedule/create" })}>
					<Plus />
					Create New Mission
				</Button>
			</div>
			<SprayScheduleTable data={tableData} />
		</div>
	);
}
