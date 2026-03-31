import {
	NonEmptyStringSchema,
	ValidEmailSchema,
} from "@mcmec/lib/constants/validators";
import { useAppForm } from "@mcmec/ui/forms/form-context";

export interface EmployeeFormValues {
	display_name: string;
	display_title: string;
	email: string;
}

interface EmployeeFormProps {
	defaultValues: EmployeeFormValues;
	formLabel: string;
	onSubmit: (value: EmployeeFormValues) => void | Promise<void>;
	submitLabel: string;
}

export function EmployeeForm({
	defaultValues,
	formLabel,
	onSubmit,
	submitLabel,
}: EmployeeFormProps) {
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
					name="display_name"
					validators={{ onBlur: NonEmptyStringSchema(1) }}
				>
					{(field) => <field.TextField label="Full Name" />}
				</form.AppField>

				<form.AppField name="email" validators={{ onBlur: ValidEmailSchema }}>
					{(field) => <field.TextField label="Email" />}
				</form.AppField>

				<form.AppField name="display_title">
					{(field) => <field.TextField label="Title (optional)" />}
				</form.AppField>

				<form.SubmitFormButton label={submitLabel} />
			</form.FormWrapper>
		</form.AppForm>
	);
}
