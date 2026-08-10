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
import { toast } from "sonner";
import { SprayScheduleForm } from "@/src/components/spray-schedule-form";
import { SPRAY_MUNICIPALITIES_KEY } from "@/src/hooks/use-spray-schedules";
import { apiFetch } from "@/src/lib/api";
import { insecticides, municipalities, spraySchedules } from "@/src/lib/db";
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
			const { rows } = await apiFetch<{
				rows: { sprayScheduleId: string; municipalityId: string }[];
			}>("/api/spray-schedules/municipalities");
			return rows
				.filter((r) => r.sprayScheduleId === sprayScheduleId)
				.map((r) => r.municipalityId);
		},
		queryKey: [...SPRAY_MUNICIPALITIES_KEY, sprayScheduleId],
	});

	const handleSubmit = async (
		value: SpraySchedulesRowType,
		municipalityIds: string[],
	) => {
		const tx = spraySchedules.update(sprayScheduleId, (draft) => {
			Object.assign(draft, value);
		});
		toastOnError(tx, "Failed to update spray schedule.");

		// Full-replace the municipality set (composite PK — no generic CRUD path for it).
		try {
			await apiFetch(`/api/spray-schedules/${sprayScheduleId}/municipalities`, {
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
