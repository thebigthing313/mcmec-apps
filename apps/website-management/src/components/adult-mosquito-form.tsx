import {
	NonEmptyStringSchema,
	NonEmptyUUID,
	ValidEmailSchema,
	ValidPhoneNumberSchema,
} from "@mcmec/lib/constants/validators";
import { AdultMosquitoRequestsBaseSchema } from "@mcmec/supabase/db/adult-mosquito-requests";
import { useAppForm } from "@mcmec/ui/forms/form-context";
import type z from "zod";

type AdultMosquitoRequestsBaseType = z.infer<
	typeof AdultMosquitoRequestsBaseSchema
>;

interface AdultMosquitoFormProps {
	defaultValues: AdultMosquitoRequestsBaseType;
	onSubmit: (value: AdultMosquitoRequestsBaseType) => void | Promise<void>;
	zipCodes: Array<{ label: string; value: string }>;
	formLabel: string;
	submitLabel: string;
}

export function AdultMosquitoForm({
	defaultValues,
	onSubmit,
	zipCodes,
	formLabel,
	submitLabel,
}: AdultMosquitoFormProps) {
	const form = useAppForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			const parsedValue = AdultMosquitoRequestsBaseSchema.parse(value);
			await onSubmit(parsedValue);
		},
	});

	return (
		<form.AppForm>
			<form.FormWrapper className="max-w-2xl" formLabel={formLabel}>
				<form.AppField
					name="full_name"
					validators={{ onBlur: NonEmptyStringSchema(2) }}
				>
					{(field) => <field.TextField label="Full Name" />}
				</form.AppField>
				<form.AppField
					name="phone"
					validators={{ onBlur: ValidPhoneNumberSchema }}
				>
					{(field) => <field.PhoneField label="Phone Number" />}
				</form.AppField>
				<form.AppField
					name="email"
					validators={{ onBlur: ValidEmailSchema.nullable() }}
				>
					{(field) => <field.TextField label="Email (optional)" />}
				</form.AppField>
				<form.AppField
					name="address_line_1"
					validators={{ onBlur: NonEmptyStringSchema(2) }}
				>
					{(field) => <field.TextField label="Address Line 1" />}
				</form.AppField>
				<form.AppField name="address_line_2">
					{(field) => <field.TextField label="Address Line 2 (optional)" />}
				</form.AppField>
				<form.AppField
					name="zip_code_id"
					validators={{ onChange: NonEmptyUUID }}
				>
					{(field) => (
						<field.ComboboxField
							label="Zip Code"
							options={zipCodes}
							placeholder="Select zip code..."
						/>
					)}
				</form.AppField>

				<fieldset className="space-y-2 rounded-md border p-4">
					<legend className="font-medium text-sm">
						Time of Day Mosquitoes Are Active
					</legend>
					<form.AppField name="is_daytime">
						{(field) => <field.CheckboxField label="Daytime" />}
					</form.AppField>
					<form.AppField name="is_dusk_dawn">
						{(field) => <field.CheckboxField label="Dusk/Dawn" />}
					</form.AppField>
					<form.AppField name="is_nighttime">
						{(field) => <field.CheckboxField label="Nighttime" />}
					</form.AppField>
				</fieldset>

				<fieldset className="space-y-2 rounded-md border p-4">
					<legend className="font-medium text-sm">
						Location of Mosquito Activity
					</legend>
					<form.AppField name="is_front_of_property">
						{(field) => <field.CheckboxField label="Front of Property" />}
					</form.AppField>
					<form.AppField name="is_rear_of_property">
						{(field) => <field.CheckboxField label="Rear of Property" />}
					</form.AppField>
					<form.AppField name="is_general_vicinity">
						{(field) => <field.CheckboxField label="General Vicinity" />}
					</form.AppField>
				</fieldset>

				<form.AppField name="is_accessible">
					{(field) => (
						<field.SwitchField
							description="Whether the property is accessible for treatment."
							label="Property Accessible"
							labelWhenFalse="The property is not accessible."
							labelWhenTrue="The property is accessible for treatment."
							orientation="vertical"
						/>
					)}
				</form.AppField>
				<form.AppField name="additional_details">
					{(field) => (
						<field.TextAreaField label="Additional Details (optional)" />
					)}
				</form.AppField>
				<form.AppField name="is_processed">
					{(field) => (
						<field.SwitchField
							description="Mark this request as processed once it has been reviewed and addressed."
							label="Processed"
							labelWhenFalse="This request has not been processed."
							labelWhenTrue="This request has been processed."
							orientation="vertical"
						/>
					)}
				</form.AppField>
				<form.SubmitFormButton className="w-full" label={submitLabel} />
			</form.FormWrapper>
		</form.AppForm>
	);
}
