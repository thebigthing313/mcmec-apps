import { useAppForm } from "@mcmec/ui/forms/form-context";
import {
	detailsFromForm,
	StaffEventDetailsSchema,
	type StaffEventFormValues,
} from "./staff-event-details";

/**
 * Field errors for the whole form, from the payload's own rules.
 *
 * Form-level rather than per field because three of the rules are about pairs — an end date
 * against a start date, an end time against a start time — and the error belongs on the second
 * field of the pair, which a validator on either field alone cannot see.
 */
function validate(values: StaffEventFormValues) {
	const fields: Record<string, string> = {};
	const result = StaffEventDetailsSchema.safeParse(detailsFromForm(values));
	for (const issue of result.success ? [] : result.error.issues) {
		const field = String(issue.path[0] ?? "");
		if (field && !fields[field]) fields[field] = issue.message;
	}
	// The form's own rule: "All day" unticked is a promise of a start time. A blank one would
	// otherwise be stored as null, which means all day — the opposite of what was chosen.
	if (
		!values.all_day &&
		values.start_time.trim() === "" &&
		!fields.start_time
	) {
		fields.start_time = "Pick a start time, or tick All day.";
	}
	return Object.keys(fields).length > 0 ? { fields } : undefined;
}

export function StaffEventForm({
	defaultValues,
	onSubmit,
	submitLabel,
	actions,
}: {
	defaultValues: StaffEventFormValues;
	onSubmit: (value: StaffEventFormValues) => void | Promise<void>;
	submitLabel: string;
	/**
	 * Lifecycle actions rendered beneath the fields — ADR 0001's buttons, never fields. A render
	 * prop because Save-and-X needs the form's current values to decide its label and payload.
	 */
	actions?: (state: { values: StaffEventFormValues }) => React.ReactNode;
}) {
	const form = useAppForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			await onSubmit(value);
		},
		validators: {
			// One validator, quiet until the first Save and live after it. A submit runs the
			// change validator too (the attempt is counted first), and keeping the errors under
			// one key means fixing a field clears them — a separate `onSubmit` validator's
			// errors would stay until the next submit and keep Save disabled.
			onChange: ({ value, formApi }) =>
				formApi.state.submissionAttempts > 0 ? validate(value) : undefined,
		},
	});

	return (
		<form.AppForm>
			<form.FormWrapper className="max-w-2xl">
				<form.AppField name="title">
					{(field) => <field.TextField label="Title" required={true} />}
				</form.AppField>
				<form.AppField name="description">
					{(field) => (
						<field.TextAreaField
							description="Plain text. Name the host or organizer here."
							label="Description"
						/>
					)}
				</form.AppField>
				<form.AppField name="starts_on">
					{(field) => (
						<field.DateField
							label="Date"
							placeholder="Select date"
							required={true}
						/>
					)}
				</form.AppField>
				<form.AppField name="ends_on">
					{(field) => (
						<field.DateField
							clearable={true}
							description="Only for a Staff Event that runs over several days."
							label="End date"
							placeholder="Same day"
						/>
					)}
				</form.AppField>
				<form.AppField
					listeners={{
						// An all-day event has no times; clearing them here means a later untick
						// starts from blank rather than resurrecting what was hidden.
						onChange: ({ value }) => {
							if (value) {
								form.setFieldValue("start_time", "");
								form.setFieldValue("end_time", "");
							}
						},
					}}
					name="all_day"
				>
					{(field) => <field.CheckboxField label="All day" />}
				</form.AppField>
				<form.Subscribe selector={(state) => state.values.all_day}>
					{(allDay) =>
						allDay ? null : (
							<div className="grid gap-4 sm:grid-cols-2">
								<form.AppField name="start_time">
									{(field) => <field.TimeField label="Start time" />}
								</form.AppField>
								<form.AppField name="end_time">
									{(field) => (
										<field.TimeField description="Optional." label="End time" />
									)}
								</form.AppField>
							</div>
						)
					}
				</form.Subscribe>
				<form.AppField name="location">
					{(field) => <field.TextField label="Location" />}
				</form.AppField>
				<form.AppField name="url">
					{(field) => (
						<field.TextField
							description="A webinar or registration link."
							label="Link"
							showPaste={true}
							type="url"
						/>
					)}
				</form.AppField>
				<form.SubmitFormButton className="w-full" label={submitLabel} />
				{actions ? (
					<form.Subscribe selector={(state) => state.values}>
						{(values) => actions({ values })}
					</form.Subscribe>
				) : null}
			</form.FormWrapper>
		</form.AppForm>
	);
}
