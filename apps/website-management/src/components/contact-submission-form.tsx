import {
	NonEmptyStringSchema,
	ValidEmailSchema,
} from "@mcmec/lib/constants/validators";
import {
	ContactFormSubmissionsRowSchema,
	type ContactFormSubmissionsRowType,
} from "@mcmec/supabase/db/contact-form-submissions";
import { useAppForm } from "@mcmec/ui/forms/form-context";

interface ContactSubmissionFormProps {
	defaultValues: ContactFormSubmissionsRowType;
	onSubmit: (value: ContactFormSubmissionsRowType) => void | Promise<void>;
	formLabel: string;
	submitLabel: string;
}

export function ContactSubmissionForm({
	defaultValues,
	onSubmit,
	formLabel,
	submitLabel,
}: ContactSubmissionFormProps) {
	const form = useAppForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			const parsedValue = ContactFormSubmissionsRowSchema.parse(value);
			await onSubmit(parsedValue);
		},
	});

	return (
		<form.AppForm>
			<form.FormWrapper className="max-w-2xl" formLabel={formLabel}>
				<form.AppField
					name="name"
					validators={{ onBlur: NonEmptyStringSchema(2) }}
				>
					{(field) => <field.TextField label="Name" />}
				</form.AppField>
				<form.AppField name="email" validators={{ onBlur: ValidEmailSchema }}>
					{(field) => <field.TextField label="Email" />}
				</form.AppField>
				<form.AppField
					name="subject"
					validators={{ onBlur: NonEmptyStringSchema(2) }}
				>
					{(field) => <field.TextField label="Subject" />}
				</form.AppField>
				<form.AppField
					name="message"
					validators={{ onBlur: NonEmptyStringSchema(10) }}
				>
					{(field) => <field.TextAreaField label="Message" />}
				</form.AppField>
				<form.AppField name="is_closed">
					{(field) => (
						<field.SwitchField
							description="Mark this submission as closed once it has been reviewed and responded to."
							label="Status"
							labelWhenFalse="This submission is open and needs attention."
							labelWhenTrue="This submission has been closed."
							orientation="vertical"
						/>
					)}
				</form.AppField>
				<form.SubmitFormButton className="w-full" label={submitLabel} />
			</form.FormWrapper>
		</form.AppForm>
	);
}
