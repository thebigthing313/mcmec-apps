import type { SpraySchedulesRowType } from "@mcmec/supabase/db/spray-schedules";
import { useLiveQuery } from "@tanstack/react-db";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SprayScheduleForm } from "@/src/components/spray-schedule-form";
import { insecticides, municipalities, spraySchedules } from "@/src/lib/db";
import { supabase } from "@/src/lib/queryClient";
import { toastOnError } from "@/src/lib/toast-on-error";

export const Route = createFileRoute("/(app)/spray-schedule/create")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Create" };
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const queryClient = useQueryClient();

	const { data: insecticideData } = useLiveQuery((q) =>
		q.from({ insecticide: insecticides }).select(({ insecticide }) => ({
			label: insecticide.trade_name,
			value: insecticide.id,
		})),
	);

	const { data: municipalityData } = useLiveQuery((q) =>
		q.from({ municipality: municipalities }).select(({ municipality }) => ({
			label: municipality.name,
			value: municipality.id,
		})),
	);

	const handleSubmit = async (
		value: SpraySchedulesRowType,
		municipalityIds: string[],
	) => {
		const tx = spraySchedules.insert(value);
		toastOnError(tx, "Failed to create spray schedule.");

		if (municipalityIds.length > 0) {
			await supabase.from("spray_schedule_municipalities").insert(
				municipalityIds.map((municipalityId) => ({
					municipality_id: municipalityId,
					spray_schedule_id: value.id,
				})),
			);
			queryClient.invalidateQueries({
				queryKey: ["spray_schedule_municipalities"],
			});
		}

		navigate({ to: "/spray-schedule" });
	};

	return (
		<SprayScheduleForm
			defaultValues={{
				area_description: "",
				created_at: new Date(),
				created_by: null,
				end_time: "23:00",
				id: crypto.randomUUID(),
				insecticide_id: "",
				map_url: null,
				mission_date: new Date(),
				municipality_ids: [],
				rain_date: null,
				start_time: "19:00",
				status: "scheduled",
				updated_at: new Date(),
				updated_by: null,
			}}
			formLabel="Create New Spray Mission"
			insecticideOptions={insecticideData}
			municipalityOptions={municipalityData}
			onSubmit={handleSubmit}
			submitLabel="Create"
		/>
	);
}
