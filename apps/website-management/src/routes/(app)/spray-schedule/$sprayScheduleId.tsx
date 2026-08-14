import { ErrorMessages } from "@mcmec/lib/constants/errors";
import type { SpraySchedulesRowType } from "@mcmec/schemas/db/spray-schedules";
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
import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { SprayScheduleForm } from "@/src/components/spray-schedule-form";
import { apiFetch } from "@/src/lib/api";
import {
	insecticides,
	municipalities,
	sprayScheduleMunicipalities,
	spraySchedules,
} from "@/src/lib/db";
import { toastOnError } from "@/src/lib/toast-on-error";
import { rowVersion, useFormSeed } from "@/src/lib/use-form-seed";

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
	const { schedule: loadedSchedule } = Route.useLoaderData();
	const { sprayScheduleId } = Route.useParams();

	// Seed from the live row, not the loader's one-shot read — see use-form-seed.ts.
	const { data: liveSchedules } = useLiveQuery(
		(q) =>
			q
				.from({ schedule: spraySchedules })
				.where(({ schedule }) => eq(schedule.id, sprayScheduleId)),
		[sprayScheduleId],
	);
	const schedule = liveSchedules[0] ?? loadedSchedule;

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

	const { data: currentLinks } = useLiveQuery(
		(q) =>
			q
				.from({ link: sprayScheduleMunicipalities })
				.where(({ link }) => eq(link.spray_schedule_id, sprayScheduleId)),
		[sprayScheduleId],
	);
	const currentMunicipalityIds = currentLinks.map(
		(link) => link.municipality_id,
	);

	// The municipality set is part of the seed too, and it lives in a separate collection with
	// no updated_at of its own — so fold the linked ids into the version stamp.
	const { seedKey, latchProps } = useFormSeed(
		rowVersion(schedule, [...currentMunicipalityIds].sort().join(",")),
	);

	const handleSubmit = async (
		value: SpraySchedulesRowType,
		municipalityIds: string[],
	) => {
		const tx = spraySchedules.update(sprayScheduleId, (draft) => {
			Object.assign(draft, value);
		});
		toastOnError(tx, "Failed to update spray schedule.");

		// Full-replace the municipality set in one transaction; the junction collection picks
		// the change up through Electric.
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

		navigate({ to: "/spray-schedule" });
	};

	const handleDelete = async () => {
		const tx = spraySchedules.delete(sprayScheduleId);
		toastOnError(tx, "Failed to delete spray schedule.");
		navigate({ to: "/spray-schedule" });
	};

	return (
		<div className="space-y-4" {...latchProps}>
			<SprayScheduleForm
				defaultValues={{
					...schedule,
					municipality_ids: currentMunicipalityIds ?? [],
				}}
				formLabel="Edit Spray Mission"
				insecticideOptions={insecticideData}
				key={seedKey}
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
