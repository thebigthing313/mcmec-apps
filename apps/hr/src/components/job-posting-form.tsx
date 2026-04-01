import { NonEmptyStringSchema } from "@mcmec/lib/constants/validators";
import { useAppForm } from "@mcmec/ui/forms/form-context";

export interface JobPostingFormValues {
	content: Record<string, unknown>;
	is_closed: boolean;
	published_at: Date | null;
	title: string;
}

interface JobPostingFormProps {
	defaultValues: JobPostingFormValues;
	formLabel: string;
	onSubmit: (value: JobPostingFormValues) => void | Promise<void>;
	submitLabel: string;
}

export function JobPostingForm({
	defaultValues,
	formLabel,
	onSubmit,
	submitLabel,
}: JobPostingFormProps) {
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
					name="title"
					validators={{ onBlur: NonEmptyStringSchema(1) }}
				>
					{(field) => <field.TextField label="Title" />}
				</form.AppField>

				<form.AppField name="content">
					{(field) => <field.ContentField label="Content" />}
				</form.AppField>

				<form.AppField name="published_at">
					{(field) => (
						<field.DateTimeField
							label="Publish Date"
							placeholder="Select publish date (leave empty for draft)"
							showTimeInput
						/>
					)}
				</form.AppField>

				<form.AppField name="is_closed">
					{(field) => (
						<field.SwitchField
							label="Closed"
							labelWhenFalse="This posting is open and will be visible on the public site when published."
							labelWhenTrue="This posting is closed and hidden from the public site."
						/>
					)}
				</form.AppField>

				<form.SubmitFormButton label={submitLabel} />
			</form.FormWrapper>
		</form.AppForm>
	);
}
