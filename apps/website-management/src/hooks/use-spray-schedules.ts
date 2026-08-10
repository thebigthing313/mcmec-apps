import { eq, useLiveQuery } from "@tanstack/react-db";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { insecticides, municipalities, spraySchedules } from "../lib/db";

type JunctionRow = { sprayScheduleId: string; municipalityId: string };

export const SPRAY_MUNICIPALITIES_KEY = ["spray_schedule_municipalities"];

export function useSpraySchedules() {
	const { data, collection } = useLiveQuery((q) =>
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
				mapUrl: schedule.map_url,
				missionDate: schedule.mission_date,
				rainDate: schedule.rain_date,
				startTime: schedule.start_time,
				status: schedule.status,
			})),
	);

	// The junction has a composite PK and no id, so it can't be a collection — it comes from
	// a plain endpoint instead and is invalidated after each municipality write.
	const { data: joinData } = useQuery({
		queryFn: () =>
			apiFetch<{ rows: JunctionRow[] }>("/api/spray-schedules/municipalities"),
		queryKey: SPRAY_MUNICIPALITIES_KEY,
	});

	const enriched = data.map((schedule) => {
		const muniIds = (joinData?.rows ?? [])
			.filter((j) => j.sprayScheduleId === schedule.id)
			.map((j) => j.municipalityId);

		const muniNames = muniIds
			.map((id) => municipalities.get(id)?.name)
			.filter((name): name is string => !!name)
			.sort()
			.join(", ");

		return {
			...schedule,
			municipalityIds: muniIds,
			municipalityNames: muniNames,
		};
	});

	return { collection, data: enriched };
}
