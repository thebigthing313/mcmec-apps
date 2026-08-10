import type { SpraySchedulesRowType } from "@mcmec/supabase/db/spray-schedules";
import { useLiveQuery } from "@tanstack/react-db";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { SprayScheduleForm } from "@/src/components/spray-schedule-form";
import { SPRAY_MUNICIPALITIES_KEY } from "@/src/hooks/use-spray-schedules";
import { apiFetch } from "@/src/lib/api";
import { insecticides, municipalities, spraySchedules } from "@/src/lib/db";
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
		// The schedule row must exist before the junction write can reference it.
		await tx.isPersisted.promise;

		if (municipalityIds.length > 0) {
			try {
				await apiFetch(`/api/spray-schedules/${value.id}/municipalities`, {
					body: JSON.stringify({ municipalityIds }),
					method: "PUT",
				});
			} catch (error) {
				toast.error(
					error instanceof Error
						? error.message
						: "Failed to save municipalities.",
				);
				return;
			}
			queryClient.invalidateQueries({ queryKey: SPRAY_MUNICIPALITIES_KEY });
		}

		navigate({ to: "/spray-schedule" });
	};

	return (
		<SprayScheduleForm
			defaultValues={{
				area_description: "",
				created_at: new Date(),
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
			}}
			formLabel="Create New Spray Mission"
			insecticideOptions={insecticideData}
			municipalityOptions={municipalityData}
			onSubmit={handleSubmit}
			submitLabel="Create"
		/>
	);
}
