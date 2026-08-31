import { NonEmptyStringSchema } from "@mcmec/lib/constants/validators";
import { useAppForm } from "@mcmec/ui/forms/form-context";

/**
 * The details of a category — the shape both `update*CategoryDetails` commands accept.
 *
 * Notice Categories and Document Categories are the same two fields under two command names, so
 * they are the same form. They were previously two 315-line screens that differed only in the
 * noun, which is precisely the duplication `RecordIndex` exists to end; a second copy of the
 * form would have rebuilt half of it.
 */
export interface CategoryFormValues {
	name: string;
	description: string;
}

interface CategoryFormProps {
	defaultValues: CategoryFormValues;
	onSubmit: (value: CategoryFormValues) => void | Promise<void>;
	formLabel: string;
	submitLabel: string;
	/** What this category classifies, for the description field's helper text. */
	classifies: string;
}

export function CategoryForm({
	classifies,
	defaultValues,
	formLabel,
	onSubmit,
	submitLabel,
}: CategoryFormProps) {
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
					validators={{ onBlur: NonEmptyStringSchema(2) }}
				>
					{(field) => <field.TextField label="Name" />}
				</form.AppField>
				<form.AppField name="description">
					{(field) => (
						<field.TextAreaField
							description={`Shown to staff when choosing a category for ${classifies}. Optional.`}
							label="Description"
						/>
					)}
				</form.AppField>
				<form.SubmitFormButton className="w-full" label={submitLabel} />
			</form.FormWrapper>
		</form.AppForm>
	);
}
