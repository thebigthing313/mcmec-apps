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
	const result = StaffEventDetailsSchema.safeParse(detailsFromForm(values));
	if (result.success) return undefined;
	const fields: Record<string, string> = {};
	for (const issue of result.error.issues) {
		const field = String(issue.path[0] ?? "");
		if (field && !fields[field]) fields[field] = issue.message;
	}
	return { fields };
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
			// Quiet until the first Save, then live, so a fix clears its error as it is typed.
			onChange: ({ value, formApi }) =>
				formApi.state.submissionAttempts > 0 ? validate(value) : undefined,
			onSubmit: ({ value }) => validate(value),
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
							description="Only for an event that runs over several days."
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
