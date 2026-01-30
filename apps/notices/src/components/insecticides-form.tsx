import {
	InsecticidesRowSchema,
	type InsecticidesRowType,
} from "@mcmec/supabase/db/insecticides";
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
				formDescription="This insecticides list are only used in the website's page dedicated to mosquito control products that the Commission uses and are not linked to actual activities."
				formLabel={formLabel}
			>
				<form.AppField name="trade_name">
					{(field) => <field.TextField label="Trade Name" />}
				</form.AppField>
				<form.AppField name="type_name">
					{(field) => <field.TextField label="Type Name" />}
				</form.AppField>
				<form.AppField name="active_ingredient">
					{(field) => <field.TextField label="Active Ingredient" />}
				</form.AppField>
				<form.AppField name="active_ingredient_url">
					{(field) => (
						<field.TextField label="Active Ingredient URL" showPaste={true} />
					)}
				</form.AppField>
				<form.AppField name="label_url">
					{(field) => <field.TextField label="Label URL" showPaste={true} />}
				</form.AppField>
				<form.AppField name="msds_url">
					{(field) => <field.TextField label="MSDS URL" showPaste={true} />}
				</form.AppField>

				<form.SubmitFormButton className="w-full" label={submitLabel} />
			</form.FormWrapper>
		</form.AppForm>
	);
}
