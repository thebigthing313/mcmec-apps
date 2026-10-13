import { LifecycleButton } from "@mcmec/ui/blocks/lifecycle-button";
import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { rowVersion, useFormSeed } from "@mcmec/ui/hooks/use-form-seed";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { getRouteApi } from "@tanstack/react-router";
import { intents } from "@/src/lib/intents";
import { changedFields } from "@/src/lib/lifecycle";
import {
	detailsFromForm,
	detailsFromRow,
	formValuesFromRow,
	StaffEventDetailsSchema,
	type StaffEventFormValues,
} from "./staff-event-details";
import { StaffEventForm } from "./staff-event-form";
import { staffEventLifecycle } from "./staff-event-lifecycle";

const route = getRouteApi("/(app)/hr/staff-events/$staffEventId_/edit");

export function EditStaffEventPage() {
	const { staffEvents } = route.useRouteContext();
	const navigate = route.useNavigate();
	const { staffEvent: loaded } = route.useLoaderData();
	const { staffEventId } = route.useParams();

	// Seed from the live row, not the loader's one-shot read — see @mcmec/ui/hooks/use-form-seed.
	const { data: live } = useLiveQuery(
		(q) =>
			q
				.from({ event: staffEvents })
				.where(({ event }) => eq(event.id, staffEventId)),
		[staffEvents, staffEventId],
	);
	const event = live[0] ?? loaded;
	const { seedKey, latchProps } = useFormSeed(rowVersion(event));

	/**
	 * What the form changed, against the LIVE row with its times as the form holds them — so an
	 * untouched "13:00:00" is not a change, the Save-and-X label cannot disagree with its
	 * payload, and `updateStaffEventDetails` is never sent nothing.
	 */
	const changesIn = (values: StaffEventFormValues) =>
		changedFields(detailsFromForm(values), detailsFromRow(event));

	const handleSubmit = (value: StaffEventFormValues) => {
		const done = () =>
			navigate({
				params: { staffEventId },
				to: "/hr/staff-events/$staffEventId",
			});
		const changes = changesIn(value);
		if (Object.keys(changes).length === 0) return done();
		const tx = staffEvents.update(
			staffEventId,
			intents("employees.updateStaffEventDetails"),
			(draft) => {
				Object.assign(draft, changes);
			},
		);
		toastOnError(tx, "Failed to update the event.");
		done();
	};

	return (
		<div className="space-y-4" {...latchProps}>
			<PageHeader title="Edit Staff Event" />
			<StaffEventForm
				actions={({ values }) => {
					const changes = changesIn(values);
					const isDirty = Object.keys(changes).length > 0;
					// A Save-and-X skips the form's own submit, so it checks the same rules first:
					// a change the server would refuse is not offered alongside the lifecycle intent.
					const savable =
						!isDirty ||
						StaffEventDetailsSchema.safeParse(detailsFromForm(values)).success;
					const lifecycle = staffEventLifecycle(staffEvents, event, {
						changes,
					});
					return (
						<LifecycleButton
							className="w-full"
							disabled={!savable}
							icon={lifecycle.icon}
							isDirty={isDirty}
							label={lifecycle.label}
							onAct={(withSave) => lifecycle.onAct(withSave)}
						/>
					);
				}}
				defaultValues={formValuesFromRow(event)}
				key={seedKey}
				onSubmit={handleSubmit}
				submitLabel="Update"
			/>
		</div>
	);
}
