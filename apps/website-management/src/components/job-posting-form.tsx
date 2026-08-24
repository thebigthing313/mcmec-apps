import { NonEmptyStringSchema } from "@mcmec/lib/constants/validators";
import { useAppForm } from "@mcmec/ui/forms/form-context";

/**
 * The details of a job posting — exactly the fields `website.updateJobPostingDetails` accepts.
 *
 * Both lifecycle fields are gone from this form. `is_closed` was a switch; it is now a
 * Close/Reopen action. `published_at` was a date picker whose emptiness MEANT draft ("leave
 * empty for draft") — publishing was spelled as typing a date. It is now a Publish button, and
 * the server stamps the timestamp, so the form no longer offers a way to backdate a posting or
 * to publish one by accident while editing its title.
 */
export interface JobPostingFormValues {
	content: Record<string, unknown>;
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

				<form.SubmitFormButton className="w-full" label={submitLabel} />
			</form.FormWrapper>
		</form.AppForm>
	);
}
