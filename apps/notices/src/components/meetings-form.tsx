import {
	MeetingsRowSchema,
	type MeetingsRowType,
} from "@mcmec/supabase/db/meetings";
import { useAppForm } from "@mcmec/ui/forms/form-context";

interface MeetingFormProps {
	defaultValues: MeetingsRowType;
	onSubmit: (value: MeetingsRowType) => void | Promise<void>;
	formLabel: string;
	submitLabel: string;
}

export function MeetingsForm({
	defaultValues,
	onSubmit,
	formLabel,
	submitLabel,
}: MeetingFormProps) {
	const form = useAppForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			const parsedValue = MeetingsRowSchema.parse(value);
			await onSubmit(parsedValue);
		},
	});

	return (
		<form.AppForm>
			<form.FormWrapper className="max-w-2xl" formLabel={formLabel}>
				<form.AppField name="name">
					{(field) => <field.TextField label="Meeting Name" />}
				</form.AppField>
				<form.AppField name="location">
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
				<form.AppField name="agenda_url">
					{(field) => <field.TextField label="Agenda Link" showPaste={true} />}
				</form.AppField>
				<form.AppField name="minutes_url">
					{(field) => <field.TextField label="Minutes Link" showPaste={true} />}
				</form.AppField>
				<form.AppField name="report_url">
					{(field) => <field.TextField label="Report Link" showPaste={true} />}
				</form.AppField>
				<form.AppField name="notice_url">
					{(field) => (
						<field.TextField label="48-Hour Notice Link" showPaste={true} />
					)}
				</form.AppField>
				<form.AppField name="notes">
					{(field) => <field.TextField label="Notes" />}
				</form.AppField>
				<form.AppField name="is_cancelled">
					{(field) => (
						<field.SwitchField
							description="Cancelled meetings will still be shown on the public meetings page. If cancelled, put the reason in the notes."
							label="Cancelled"
						/>
					)}
				</form.AppField>
				<form.SubmitFormButton className="w-full" label={submitLabel} />
			</form.FormWrapper>
		</form.AppForm>
	);
}
