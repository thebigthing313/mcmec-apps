import { NonEmptyUUID } from "@mcmec/lib/constants/validators";
import { FormField } from "@mcmec/ui/blocks/form-field";
import { Input } from "@mcmec/ui/components/input";
import { useAppForm } from "@mcmec/ui/forms/form-context";
import z from "zod";

/**
 * The details of a document — exactly the fields `website.updateDocumentDetails` accepts.
 *
 * `is_published` is not here. A lifecycle column can only move through a named command, so
 * publishing is an action on the document rather than a switch inside an edit form.
 *
 * Nor are `id`, `created_at` and `updated_at`: they were only ever in this form because the old
 * generic `PATCH /api/data/documents` wanted a whole row. A command payload declares its own
 * fields, so the form no longer has to carry columns the user never sees.
 */
export interface DocumentDetailValues {
	document_type_id: string;
	fiscal_year: number;
	url: string;
}

/** What the form submits. Creating a document is the one place the publish state is a choice. */
export type DocumentFormValues = DocumentDetailValues & {
	is_published: boolean;
};

interface DocumentFormProps {
	defaultValues: DocumentDetailValues;
	onSubmit: (value: DocumentFormValues) => void | Promise<void>;
	categories: Array<{ label: string; value: string }>;
	formLabel: string;
	submitLabel: string;
	/**
	 * Create offers the initial publish state; edit moves it to a Publish/Unpublish action, and
	 * the field is then neither rendered nor read — `updateDocumentDetails` has no such field to
	 * send it to.
	 */
	mode: "create" | "edit";
	/**
	 * Lifecycle actions rendered beneath the fields — ADR 0001's buttons, never fields.
	 *
	 * A render prop rather than a plain node because Save-and-X needs the form's *current*
	 * values: the caller diffs them against the live row to decide whether the label says
	 * "Publish" or "Save and Publish", and to fill the `updateDocumentDetails` half of the
	 * envelope. The form keeps owning its state; the caller borrows a read of it.
	 */
	actions?: (state: { values: DocumentFormValues }) => React.ReactNode;
}

const NonEmptyUrlSchema = z.url("Please enter a valid URL.");

export function DocumentForm({
	defaultValues,
	onSubmit,
	categories,
	formLabel,
	submitLabel,
	mode,
	actions,
}: DocumentFormProps) {
	const form = useAppForm({
		defaultValues: { ...defaultValues, is_published: false },
		onSubmit: async ({ value }) => {
			await onSubmit(value);
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
				{mode === "create" ? (
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
				) : null}
				<form.SubmitFormButton className="w-full" label={submitLabel} />
				{actions ? (
					<form.Subscribe selector={(state) => state.values}>
						{(values) => actions({ values })}
					</form.Subscribe>
				) : null}
			</form.FormWrapper>
		</form.AppForm>
	);
}
