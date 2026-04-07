import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SprayScheduleCard } from "@/src/components/spray-schedule-card";
import { SprayScheduleFilters } from "@/src/components/spray-schedule-filters";
import {
	municipalitiesQueryOptions,
	spraySchedulesQueryOptions,
} from "@/src/lib/queries";

export const Route = createFileRoute("/mosquito-control/spray-schedule")({
	component: RouteComponent,
	loader: async ({ context }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(spraySchedulesQueryOptions()),
			context.queryClient.ensureQueryData(municipalitiesQueryOptions()),
		]);
	},
});

function RouteComponent() {
	const { data: schedules } = useSuspenseQuery(spraySchedulesQueryOptions());
	const { data: municipalitiesData } = useSuspenseQuery(
		municipalitiesQueryOptions(),
	);

	const [selectedMunicipality, setSelectedMunicipality] = useState("all");
	const [selectedStatus, setSelectedStatus] = useState("all");

	const municipalitiesList = municipalitiesData.map((m) => ({
		id: m.id,
		name: m.name,
	}));

	const filteredSchedules = useMemo(() => {
		return schedules
			.filter((s) => {
				if (
					selectedMunicipality !== "all" &&
					!s.municipalities.some((m) => m.id === selectedMunicipality)
				) {
					return false;
				}
				if (selectedStatus !== "all" && s.status !== selectedStatus) {
					return false;
				}
				return true;
			})
			.sort(
				(a, b) =>
					new Date(b.mission_date).getTime() -
					new Date(a.mission_date).getTime(),
			);
	}, [schedules, selectedMunicipality, selectedStatus]);

	return (
		<div className="flex flex-col gap-6">
			<article className="prose lg:prose-base max-w-none">
				<h1>Mosquito Spray Schedule</h1>
				<p>
					View upcoming and past mosquito spray missions conducted by the
					Middlesex County Mosquito Extermination Commission. Spray operations
					are weather-dependent and may be delayed or cancelled.
				</p>
			</article>

			<SprayScheduleFilters
				municipalities={municipalitiesList}
				onMunicipalityChange={setSelectedMunicipality}
				onStatusChange={setSelectedStatus}
				selectedMunicipality={selectedMunicipality}
				selectedStatus={selectedStatus}
			/>

			<div className="flex flex-col gap-4">
				{filteredSchedules.length > 0 ? (
					filteredSchedules.map((schedule) => (
						<SprayScheduleCard
							areaDescription={schedule.area_description}
							endTime={schedule.end_time}
							insecticideLabelUrl={schedule.insecticideLabelUrl}
							insecticideMsdsUrl={schedule.insecticideMsdsUrl}
							insecticideName={schedule.insecticideName}
							key={schedule.id}
							mapUrl={schedule.map_url}
							missionDate={schedule.mission_date}
							municipalities={schedule.municipalities
								.map((m) => m.name)
								.sort()
								.join(", ")}
							rainDate={schedule.rain_date}
							startTime={schedule.start_time}
							status={schedule.status}
						/>
					))
				) : (
					<p className="py-8 text-center text-muted-foreground">
						No spray missions found matching your filters.
					</p>
				)}
			</div>
		</div>
	);
}
