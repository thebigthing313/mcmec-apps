import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { getRouteApi } from "@tanstack/react-router";
import { intents } from "@/src/lib/intents";
import {
	detailsFromForm,
	type StaffEventFormValues,
} from "./staff-event-details";
import { StaffEventForm } from "./staff-event-form";

const route = getRouteApi("/(app)/hr/staff-events/create");

export function CreateStaffEventPage() {
	const { staffEvents } = route.useRouteContext();
	const navigate = route.useNavigate();

	const handleSubmit = (value: StaffEventFormValues) => {
		const now = new Date();
		// The id minted here is the id the row will have: the envelope carries it and the handler
		// honours it, which is what lets this navigate straight to the detail route.
		const id = crypto.randomUUID();
		const tx = staffEvents.insert(
			{
				...detailsFromForm(value),
				created_at: now,
				id,
				// Not in `createStaffEvent`'s payload: an event is born uncancelled. The optimistic
				// row still needs the column, because the collection holds whole rows.
				is_cancelled: false,
				updated_at: now,
			},
			intents("employees.createStaffEvent"),
		);
		toastOnError(tx, "Failed to add the Staff Event.");
		navigate({
			params: { staffEventId: id },
			to: "/hr/staff-events/$staffEventId",
		});
	};

	return (
		<div>
			<PageHeader title="Add Staff Event" />
			<StaffEventForm
				defaultValues={{
					all_day: false,
					description: "",
					end_time: "",
					ends_on: null,
					location: "",
					start_time: "",
					starts_on: "",
					title: "",
					url: "",
				}}
				onSubmit={handleSubmit}
				submitLabel="Add Staff Event"
			/>
		</div>
	);
}
