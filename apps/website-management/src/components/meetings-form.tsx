import {
	NonEmptyStringSchema,
	ValidURLSchema,
} from "@mcmec/lib/constants/validators";
import { useAppForm } from "@mcmec/ui/forms/form-context";

/**
 * The details of a meeting — exactly the fields `website.updateMeetingDetails` accepts.
 *
 * `is_cancelled` is not here. It was a `SwitchField` at the bottom of this form, which is the
 * conflation ADR 0001 exists to remove: a lifecycle column read as something you set and then
 * saved. It now moves only through `cancelMeeting` / `uncancelMeeting`, so cancelling is an
 * action on the meeting rather than a field inside its edit form.
 *
 * `notes` stays, and keeps its own field — but loses the conditional validator that used to
 * require it whenever the switch was on, and the `onChange` hook on the switch that
 * revalidated it. That rule is a precondition on `cancelMeeting` now, checked server-side
 * against the stored row. Re-homing it takes two interlocking validators out of this form and
 * leaves one plain optional field, which is the simplification #138 predicted.
 *
 * Nor are `id`, `created_at` and `updated_at`: they were only ever here because the old generic
 * `PATCH /api/data/meetings` wanted a whole row.
 */
export interface MeetingFormValues {
	name: string;
	location: string;
	meeting_at: Date;
	minutes_url: string | null;
	notice_url: string | null;
	notes: string | null;
}

interface MeetingsFormProps {
	defaultValues: MeetingFormValues;
	onSubmit: (value: MeetingFormValues) => void | Promise<void>;
	formLabel: string;
	submitLabel: string;
	/**
	 * Lifecycle actions rendered beneath the fields — ADR 0001's buttons, never fields.
	 *
	 * A render prop rather than a plain node because Save-and-X needs the form's *current*
	 * values: the caller diffs them against the live row to decide whether the label says
	 * "Cancel Meeting" or "Save and Cancel Meeting", and to fill the `updateMeetingDetails`
	 * half of the envelope. The form keeps owning its state; the caller borrows a read of it.
	 */
	actions?: (state: { values: MeetingFormValues }) => React.ReactNode;
}

export function MeetingsForm({
	defaultValues,
	onSubmit,
	formLabel,
	submitLabel,
	actions,
}: MeetingsFormProps) {
	const form = useAppForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			await onSubmit(value);
		},
	});

	return (
		<form.AppForm>
			<form.FormWrapper className="max-w-2xl" formLabel={formLabel}>
				<form.AppField
					name="name"
					validators={{ onBlur: NonEmptyStringSchema(5) }}
				>
					{(field) => <field.TextField label="Meeting Name" />}
				</form.AppField>
				<form.AppField
					name="location"
					validators={{ onBlur: NonEmptyStringSchema(5) }}
				>
					{(field) => <field.TextField label="Address/Location" />}
				</form.AppField>
				<form.AppField name="meeting_at">
					{(field) => (
						<field.DateTimeField
							label="Meeting Date and Time"
							showTimeInput={true}
						/>
					)}
				</form.AppField>
				<form.AppField
					name="minutes_url"
					validators={{ onBlur: ValidURLSchema.nullable() }}
				>
					{(field) => <field.TextField label="Minutes Link" showPaste={true} />}
				</form.AppField>
				<form.AppField
					name="notice_url"
					validators={{ onBlur: ValidURLSchema.nullable() }}
				>
					{(field) => (
						<field.TextField label="48-Hour Notice Link" showPaste={true} />
					)}
				</form.AppField>
				<form.AppField name="notes">
					{(field) => (
						<field.TextField
							description="Shown on the public meetings page. Cancelling a meeting requires a note saying why."
							label="Notes"
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
