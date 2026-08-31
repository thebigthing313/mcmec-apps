import {
	NonEmptyStringSchema,
	ValidURLSchema,
} from "@mcmec/lib/constants/validators";
import {
	InsecticidesRowSchema,
	type InsecticidesRowType,
} from "@mcmec/schemas/db/insecticides";
import { useAppForm } from "@mcmec/ui/forms/form-context";

interface InsecticidesFormProps {
	defaultValues: InsecticidesRowType;
	onSubmit: (value: InsecticidesRowType) => void | Promise<void>;
	formLabel: string;
	submitLabel: string;
}

export function InsecticidesForm({
	defaultValues,
	onSubmit,
	formLabel,
	submitLabel,
}: InsecticidesFormProps) {
	const form = useAppForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			const parsedValue = InsecticidesRowSchema.parse(value);
			await onSubmit(parsedValue);
		},
	});

	return (
		<form.AppForm>
			<form.FormWrapper
				className="max-w-2xl"
				formDescription="These products appear in the public insecticide catalogue. Listing one here does not record that it was applied — that is a Spray Mission."
				formLabel={formLabel}
			>
				<form.AppField
					name="trade_name"
					validators={{ onBlur: NonEmptyStringSchema(5) }}
				>
					{(field) => <field.TextField label="Trade Name" />}
				</form.AppField>
				<form.AppField
					name="type_name"
					validators={{ onBlur: NonEmptyStringSchema(5) }}
				>
					{(field) => <field.TextField label="Type Name" />}
				</form.AppField>
				<form.AppField
					name="active_ingredient"
					validators={{ onBlur: NonEmptyStringSchema() }}
				>
					{(field) => <field.TextField label="Active Ingredient" />}
				</form.AppField>
				<form.AppField
					name="active_ingredient_url"
					validators={{ onBlur: ValidURLSchema }}
				>
					{(field) => (
						<field.TextField label="Active Ingredient URL" showPaste={true} />
					)}
				</form.AppField>
				<form.AppField name="label_url" validators={{ onBlur: ValidURLSchema }}>
					{(field) => <field.TextField label="Label URL" showPaste={true} />}
				</form.AppField>
				<form.AppField name="msds_url" validators={{ onBlur: ValidURLSchema }}>
					{(field) => <field.TextField label="SDS URL" showPaste={true} />}
				</form.AppField>

				<form.SubmitFormButton className="w-full" label={submitLabel} />
			</form.FormWrapper>
		</form.AppForm>
	);
}
