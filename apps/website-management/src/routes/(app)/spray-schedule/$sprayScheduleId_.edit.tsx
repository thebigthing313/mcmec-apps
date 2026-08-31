import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { LifecycleButton } from "@mcmec/ui/blocks/lifecycle-button";
import { rowVersion, useFormSeed } from "@mcmec/ui/hooks/use-form-seed";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import {
	type SprayMissionFormValues,
	SprayScheduleForm,
} from "@/src/components/spray-schedule-form";
import {
	insecticides,
	municipalities,
	sprayScheduleMunicipalities,
	spraySchedules,
} from "@/src/lib/db";
import { changedFields, runLifecycle } from "@/src/lib/lifecycle";
import { transitionsFrom } from "@/src/lib/spray-mission-transitions";
import { sameMunicipalities, saveSprayMission } from "@/src/lib/spray-missions";

export const Route = createFileRoute(
	"/(app)/spray-schedule/$sprayScheduleId_/edit",
)({
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

/** Exactly the columns `website.updateSprayMissionDetails` accepts — `municipality_ids` is not
 * one of them: it belongs to the junction table and travels beside the payload, not in it. */
function detailValues(
	value: SprayMissionFormValues,
): Omit<SprayMissionFormValues, "municipality_ids"> {
	return {
		area_description: value.area_description,
		end_time: value.end_time,
		insecticide_id: value.insecticide_id,
		map_url: value.map_url,
		mission_date: value.mission_date,
		rain_date: value.rain_date,
		start_time: value.start_time,
	};
}

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { schedule: loadedSchedule } = Route.useLoaderData();
	const { sprayScheduleId } = Route.useParams();

	// Seed from the live row, not the loader's one-shot read — see @mcmec/ui/hooks/use-form-seed.
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
		q
			.from({ municipality: municipalities })
			.orderBy(({ municipality }) => municipality.name, "asc")
			.select(({ municipality }) => ({
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

	/**
	 * What this save actually asks for: the columns that differ from the live row, and the
	 * municipality set if it differs from the linked one.
	 *
	 * Both are diffs against live state rather than a sticky `isDirty`, so the button's label
	 * and the request's payload cannot disagree — a typed-then-reverted field would otherwise
	 * relabel to "Save and Cancel Mission" and then hand `updateSprayMissionDetails` an empty
	 * payload, which its own non-empty refinement refuses, killing the lifecycle command with it.
	 */
	const pendingSave = (value: SprayMissionFormValues) => {
		const changes = changedFields(detailValues(value), schedule);
		const municipalityIds = sameMunicipalities(
			value.municipality_ids,
			currentMunicipalityIds,
		)
			? undefined
			: value.municipality_ids;
		return {
			changes,
			isDirty: Object.keys(changes).length > 0 || municipalityIds !== undefined,
			municipalityIds,
		};
	};

	const handleSubmit = async (value: SprayMissionFormValues) => {
		const { changes, municipalityIds } = pendingSave(value);
		await saveSprayMission(sprayScheduleId, changes, municipalityIds);
		navigate({
			params: { sprayScheduleId },
			to: "/spray-schedule/$sprayScheduleId",
		});
	};

	return (
		<div className="space-y-4" {...latchProps}>
			<SprayScheduleForm
				actions={({ values }) => {
					const { changes, isDirty, municipalityIds } = pendingSave(values);

					// One request, both intents, one transaction — so the two either land
					// together or roll back together. `municipality_ids` rides in the same
					// envelope through the `arguments` channel, which is what makes
					// "Save and Delay" cover a rain date typed a second earlier.
					return transitionsFrom(schedule.status).map((transition) => (
						<LifecycleButton
							className="w-full"
							icon={transition.icon}
							isDirty={isDirty}
							key={transition.command}
							label={transition.label}
							onAct={(withSave) =>
								runLifecycle(spraySchedules, sprayScheduleId, {
									apply: (draft) => {
										draft.status = transition.to;
									},
									command: transition.command,
									failure: transition.failure,
									save: withSave
										? {
												arguments:
													municipalityIds === undefined
														? undefined
														: { municipality_ids: municipalityIds },
												changes,
												command: "website.updateSprayMissionDetails",
											}
										: undefined,
								})
							}
						/>
					));
				}}
				defaultValues={{
					area_description: schedule.area_description,
					end_time: schedule.end_time,
					insecticide_id: schedule.insecticide_id,
					map_url: schedule.map_url,
					mission_date: schedule.mission_date,
					municipality_ids: currentMunicipalityIds,
					rain_date: schedule.rain_date,
					start_time: schedule.start_time,
				}}
				formLabel="Edit Spray Mission"
				insecticideOptions={insecticideData}
				key={seedKey}
				municipalityOptions={municipalityData}
				onSubmit={handleSubmit}
				submitLabel="Update"
			/>
		</div>
	);
}
