import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import {
	type SprayMissionFormValues,
	SprayScheduleForm,
} from "@/src/components/spray-schedule-form";
import {
	insecticides,
	intents,
	municipalities,
	spraySchedules,
	withArguments,
} from "@/src/lib/db";

export const Route = createFileRoute("/(app)/spray-schedule/create")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Create" };
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();

	const { data: insecticideData } = useLiveQuery((q) =>
		q
			.from({ insecticide: insecticides })
			.orderBy(({ insecticide }) => insecticide.trade_name)
			.select(({ insecticide }) => ({
				label: insecticide.trade_name,
				value: insecticide.id,
			})),
	);

	const { data: municipalityData } = useLiveQuery((q) =>
		q
			.from({ municipality: municipalities })
			.orderBy(({ municipality }) => municipality.name)
			.select(({ municipality }) => ({
				label: municipality.name,
				value: municipality.id,
			})),
	);

	const handleSubmit = async (value: SprayMissionFormValues) => {
		const now = new Date();
		const { municipality_ids, ...details } = value;
		// One request, both tables. Under the old path this was an insert followed by a
		// separate PUT of the junction set, with an `await tx.isPersisted.promise` between them
		// so the schedule existed before the second write could reference it — and nothing to
		// undo the first if the second failed.
		const id = crypto.randomUUID();
		const tx = spraySchedules.insert(
			{
				...details,
				created_at: now,
				// The id we mint here is the id the row will have: the envelope carries it, the
				// handler honours it, and the junction rows written in the same transaction
				// point at it. Under the old path it was thrown away server-side.
				id,
				// Not on the form and not in `createSprayMission`'s payload: a mission is born
				// scheduled. The old status dropdown was offered here too, so a mission could be
				// created already cancelled. The optimistic row still needs the column, because
				// the collection holds whole rows.
				status: "scheduled",
				updated_at: now,
			},
			withArguments(intents("website.createSprayMission"), {
				municipality_ids,
			}),
		);
		toastOnError(tx, "Failed to create spray mission.");
		navigate({
			params: { sprayScheduleId: id },
			to: "/spray-schedule/$sprayScheduleId",
		});
	};

	return (
		<SprayScheduleForm
			defaultValues={{
				area_description: "",
				end_time: "23:00",
				insecticide_id: "",
				map_url: null,
				mission_date: new Date(),
				municipality_ids: [],
				rain_date: null,
				start_time: "19:00",
			}}
			formLabel="Create Spray Mission"
			insecticideOptions={insecticideData}
			municipalityOptions={municipalityData}
			onSubmit={handleSubmit}
			submitLabel="Create"
		/>
	);
}
