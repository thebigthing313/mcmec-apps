import {
	NonEmptyStringSchema,
	NonEmptyUUID,
	ValidEmailSchema,
	ValidPhoneNumberSchema,
} from "@mcmec/lib/constants/validators";
import { WaterManagementRequestsBaseSchema } from "@mcmec/supabase/db/water-management-requests";
import { useAppForm } from "@mcmec/ui/forms/form-context";
import type z from "zod";

type WaterManagementRequestsBaseType = z.infer<
	typeof WaterManagementRequestsBaseSchema
>;

interface WaterManagementFormProps {
	defaultValues: WaterManagementRequestsBaseType;
	onSubmit: (value: WaterManagementRequestsBaseType) => void | Promise<void>;
	zipCodes: Array<{ label: string; value: string }>;
	formLabel: string;
	submitLabel: string;
}

export function WaterManagementForm({
	defaultValues,
	onSubmit,
	zipCodes,
	formLabel,
	submitLabel,
}: WaterManagementFormProps) {
	const form = useAppForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			const parsedValue = WaterManagementRequestsBaseSchema.parse(value);
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
						Location of Standing Water
					</legend>
					<form.AppField name="is_on_my_property">
						{(field) => <field.CheckboxField label="On My Property" />}
					</form.AppField>
					<form.AppField name="is_on_neighbor_property">
						{(field) => <field.CheckboxField label="On Neighbor's Property" />}
					</form.AppField>
					<form.AppField name="is_on_public_property">
						{(field) => <field.CheckboxField label="On Public Property" />}
					</form.AppField>
				</fieldset>

				<form.AppField name="other_location_description">
					{(field) => (
						<field.TextAreaField label="Other Location Description (optional)" />
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
