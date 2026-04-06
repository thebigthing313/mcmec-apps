import { ErrorMessages } from "@mcmec/lib/constants/errors";
import type { SpraySchedulesRowType } from "@mcmec/supabase/db/spray-schedules";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@mcmec/ui/components/alert-dialog";
import { Button } from "@mcmec/ui/components/button";
import { useLiveQuery } from "@tanstack/react-db";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SprayScheduleForm } from "@/src/components/spray-schedule-form";
import { insecticides, municipalities, spraySchedules } from "@/src/lib/db";
import { supabase } from "@/src/lib/queryClient";
import { toastOnError } from "@/src/lib/toast-on-error";

export const Route = createFileRoute("/(app)/spray-schedule/$sprayScheduleId")({
	component: RouteComponent,
	loader: async ({ params }) => {
		await spraySchedules.preload();
		const schedule = spraySchedules.get(params.sprayScheduleId);
		if (!schedule) {
			throw new Error(ErrorMessages.DATABASE.RECORD_NOT_AVAILABLE);
		}
		return { crumb: "Edit", schedule };
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const queryClient = useQueryClient();
	const { schedule } = Route.useLoaderData();
	const { sprayScheduleId } = Route.useParams();

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

	const { data: currentMunicipalityIds } = useQuery({
		queryFn: async () => {
			const { data, error } = await supabase
				.from("spray_schedule_municipalities")
				.select("municipality_id")
				.eq("spray_schedule_id", sprayScheduleId);
			if (error) return [];
			return data.map((m) => m.municipality_id);
		},
		queryKey: ["spray_schedule_municipalities", sprayScheduleId],
	});

	const handleSubmit = async (
		value: SpraySchedulesRowType,
		municipalityIds: string[],
	) => {
		const tx = spraySchedules.update(sprayScheduleId, (draft) => {
			Object.assign(draft, value);
		});
		toastOnError(tx, "Failed to update spray schedule.");

		// Replace municipality links
		await supabase
			.from("spray_schedule_municipalities")
			.delete()
			.eq("spray_schedule_id", sprayScheduleId);

		if (municipalityIds.length > 0) {
			// biome-ignore lint/suspicious/noExplicitAny: table not yet in generated types
			await (supabase as any).from("spray_schedule_municipalities").insert(
				municipalityIds.map((muniId) => ({
					municipality_id: muniId,
					spray_schedule_id: sprayScheduleId,
				})),
			);
		}

		queryClient.invalidateQueries({
			queryKey: ["spray_schedule_municipalities"],
		});
		navigate({ to: "/spray-schedule" });
	};

	const handleDelete = async () => {
		const tx = spraySchedules.delete(sprayScheduleId);
		toastOnError(tx, "Failed to delete spray schedule.");
		navigate({ to: "/spray-schedule" });
	};

	return (
		<div className="space-y-4">
			<SprayScheduleForm
				defaultValues={{
					...schedule,
					municipality_ids: currentMunicipalityIds ?? [],
				}}
				formLabel="Edit Spray Mission"
				insecticideOptions={insecticideData}
				municipalityOptions={municipalityData}
				onSubmit={handleSubmit}
				submitLabel="Update"
			/>

			<div className="max-w-2xl">
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button className="w-full" variant="destructive">
							Delete Spray Mission
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
							<AlertDialogDescription>
								This action cannot be undone. This will permanently delete this
								spray schedule entry.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction onClick={handleDelete}>
								Delete
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	);
}
