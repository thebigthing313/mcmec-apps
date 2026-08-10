import { eq, useLiveQuery } from "@tanstack/react-db";
import { useQuery } from "@tanstack/react-query";
import {
	employees,
	insecticides,
	municipalities,
	spraySchedules,
} from "../lib/db";
import { supabase } from "../lib/queryClient";

export function useSpraySchedules() {
	const { data, collection } = useLiveQuery((q) =>
		q
			.from({ schedule: spraySchedules })
			.innerJoin({ insecticide: insecticides }, ({ schedule, insecticide }) =>
				eq(schedule.insecticide_id, insecticide.id),
			)
			.select(({ schedule, insecticide }) => ({
				areaDescription: schedule.area_description,
				createdById: schedule.created_by,
				endTime: schedule.end_time,
				id: schedule.id,
				insecticideName: insecticide?.trade_name ?? "",
				mapUrl: schedule.map_url,
				missionDate: schedule.mission_date,
				rainDate: schedule.rain_date,
				startTime: schedule.start_time,
				status: schedule.status,
			})),
	);

	const { data: joinData } = useQuery({
		queryFn: async () => {
			const { data, error } = await supabase
				.from("spray_schedule_municipalities")
				.select("spray_schedule_id, municipality_id");
			if (error) return [];
			return data;
		},
		queryKey: ["spray_schedule_municipalities"],
		refetchInterval: 5000,
	});

	const enriched = data.map((schedule) => {
		const muniIds = (joinData ?? [])
			.filter((j) => j.spray_schedule_id === schedule.id)
			.map((j) => j.municipality_id);

		const muniNames = muniIds
			.map((id) => municipalities.get(id)?.name)
			.filter((name): name is string => !!name)
			.sort()
			.join(", ");

		const createdByName = schedule.createdById
			? (employees.get(schedule.createdById)?.display_name ?? null)
			: null;

		return {
			...schedule,
			createdByName,
			municipalityIds: muniIds,
			municipalityNames: muniNames,
		};
	});

	return { collection, data: enriched };
}
