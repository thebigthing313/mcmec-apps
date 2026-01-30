import { ErrorMessages } from "@mcmec/lib/constants/errors";
import {
	NonEmptyStringSchema,
	ValidURLSchema,
} from "@mcmec/lib/constants/validators";
import {
	MeetingsRowSchema,
	type MeetingsRowType,
} from "@mcmec/supabase/db/meetings";
import { useAppForm } from "@mcmec/ui/forms/form-context";
import z from "zod";

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
					name="agenda_url"
					validators={{ onBlur: ValidURLSchema.nullable() }}
				>
					{(field) => <field.TextField label="Agenda Link" showPaste={true} />}
				</form.AppField>
				<form.AppField
					name="minutes_url"
					validators={{ onBlur: ValidURLSchema.nullable() }}
				>
					{(field) => <field.TextField label="Minutes Link" showPaste={true} />}
				</form.AppField>
				<form.AppField
					name="report_url"
					validators={{ onBlur: ValidURLSchema.nullable() }}
				>
					{(field) => <field.TextField label="Report Link" showPaste={true} />}
				</form.AppField>
				<form.AppField
					name="notice_url"
					validators={{ onBlur: ValidURLSchema.nullable() }}
				>
					{(field) => (
						<field.TextField label="48-Hour Notice Link" showPaste={true} />
					)}
				</form.AppField>
				<form.AppField
					name="notes"
					validators={{
						onBlur: ({ fieldApi }) => {
							const isCancelled = fieldApi.form.getFieldValue("is_cancelled");
							if (isCancelled) {
								const errors = fieldApi.parseValueWithSchema(
									z
										.string("Notes are required if the meeting is cancelled.")
										.min(5, ErrorMessages.VALIDATION.FIELD_TOO_SHORT(5)),
								);
								if (errors) return errors;
							}
							return undefined;
						},
					}}
				>
					{(field) => <field.TextField label="Notes" />}
				</form.AppField>
				<form.AppField
					name="is_cancelled"
					validators={{
						onChange: ({ fieldApi }) => {
							// Revalidate notes field when is_cancelled changes
							fieldApi.form.validateField("notes", "blur");
							return undefined;
						},
					}}
				>
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
