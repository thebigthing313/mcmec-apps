import { NonEmptyUUID } from "@mcmec/lib/constants/validators";
import {
	DocumentsRowSchema,
	type DocumentsRowType,
} from "@mcmec/supabase/db/documents";
import { FormField } from "@mcmec/ui/blocks/form-field";
import { Input } from "@mcmec/ui/components/input";
import { useAppForm } from "@mcmec/ui/forms/form-context";
import z from "zod";

interface DocumentFormProps {
	defaultValues: {
		id: string;
		document_type_id: string;
		fiscal_year: number;
		url: string;
		is_published: boolean;
		created_at: Date;
		created_by: string | null;
		updated_at: Date;
		updated_by: string | null;
	};
	onSubmit: (value: DocumentsRowType) => void | Promise<void>;
	categories: Array<{ label: string; value: string }>;
	formLabel: string;
	submitLabel: string;
}

const NonEmptyUrlSchema = z.url("Please enter a valid URL.");

export function DocumentForm({
	defaultValues,
	onSubmit,
	categories,
	formLabel,
	submitLabel,
}: DocumentFormProps) {
	const form = useAppForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			const parsedValue = DocumentsRowSchema.parse(value);
			await onSubmit(parsedValue);
		},
	});

	return (
		<form.AppForm>
			<form.FormWrapper className="max-w-2xl" formLabel={formLabel}>
				<form.AppField
					name="document_type_id"
					validators={{
						onChange: NonEmptyUUID,
					}}
				>
					{(field) => (
						<field.ComboboxField
							label="Document Type"
							options={categories}
							placeholder="Select document type..."
						/>
					)}
				</form.AppField>
				<form.AppField
					name="fiscal_year"
					validators={{
						onBlur: z.number().int().min(2000).max(2100),
					}}
				>
					{(field) => (
						<FormField
							data-invalid={!field.state.meta.isValid}
							description="The fiscal year this document applies to."
							errors={field.state.meta.errors}
							htmlFor={field.name}
							label="Fiscal Year"
						>
							<Input
								id={field.name}
								max={2100}
								min={2000}
								name={field.name}
								onBlur={field.handleBlur}
								onChange={(e) =>
									field.handleChange(Number.parseInt(e.target.value, 10) || 0)
								}
								type="number"
								value={field.state.value}
							/>
						</FormField>
					)}
				</form.AppField>
				<form.AppField name="url" validators={{ onBlur: NonEmptyUrlSchema }}>
					{(field) => (
						<field.TextField
							description="The URL where the document is hosted (e.g., Google Drive link)."
							label="Document URL"
							showPaste
						/>
					)}
				</form.AppField>
				<form.AppField name="is_published">
					{(field) => (
						<field.SwitchField
							description="Mark document as ready to publish or as a draft."
							label="Publish Status"
							labelWhenFalse="This document is a draft and will not display on the public site."
							labelWhenTrue="This document is published and will display on the transparency page."
							orientation="vertical"
						/>
					)}
				</form.AppField>
				<form.SubmitFormButton className="w-full" label={submitLabel} />
			</form.FormWrapper>
		</form.AppForm>
	);
}
