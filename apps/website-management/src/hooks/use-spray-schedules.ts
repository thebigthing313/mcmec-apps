import { eq, useLiveQuery } from "@tanstack/react-db";
import {
	insecticides,
	municipalities,
	sprayScheduleMunicipalities,
	spraySchedules,
} from "../lib/db";

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

	// The junction syncs like any other collection, so a municipality write shows up here
	// without an invalidation step.
	const { data: links } = useLiveQuery((q) =>
		q.from({ link: sprayScheduleMunicipalities }),
	);

	const enriched = data.map((schedule) => {
		const muniIds = links
			.filter((link) => link.spray_schedule_id === schedule.id)
			.map((link) => link.municipality_id);

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
