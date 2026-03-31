import {
	NonEmptyStringSchema,
	NonEmptyUUID,
	ValidEmailSchema,
	ValidPhoneNumberSchema,
} from "@mcmec/lib/constants/validators";
import {
	MosquitofishRequestsRowSchema,
	type MosquitofishRequestsRowType,
} from "@mcmec/supabase/db/mosquitofish-requests";
import { useAppForm } from "@mcmec/ui/forms/form-context";

interface MosquitofishFormProps {
	defaultValues: MosquitofishRequestsRowType;
	onSubmit: (value: MosquitofishRequestsRowType) => void | Promise<void>;
	zipCodes: Array<{ label: string; value: string }>;
	formLabel: string;
	submitLabel: string;
}

export function MosquitofishForm({
	defaultValues,
	onSubmit,
	zipCodes,
	formLabel,
	submitLabel,
}: MosquitofishFormProps) {
	const form = useAppForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			const parsedValue = MosquitofishRequestsRowSchema.parse(value);
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
				<form.AppField
					name="type_of_water_body"
					validators={{ onBlur: NonEmptyStringSchema(3) }}
				>
					{(field) => <field.TextField label="Type of Water Body" />}
				</form.AppField>
				<form.AppField
					name="location_of_water_body"
					validators={{ onBlur: NonEmptyStringSchema(5) }}
				>
					{(field) => <field.TextField label="Location of Water Body" />}
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
