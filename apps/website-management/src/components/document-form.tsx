import { NonEmptyUUID } from "@mcmec/lib/constants/validators";
import { FormField } from "@mcmec/ui/blocks/form-field";
import { LifecycleButton } from "@mcmec/ui/blocks/lifecycle-button";
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

/**
 * What the form submits: the details plus the state the document is being created in.
 *
 * `is_published` is not a field the author sets — it is decided by *which button was pressed*,
 * and the form fills it in from the submit's meta. Create offers two acts, "Create as Draft" and
 * "Create and Publish", so a document reaches the transparency page because someone chose to put
 * it there.
 */
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
	 * Create renders its own "Create and Publish" beneath the primary submit; edit leaves the
	 * lifecycle to `actions`, where the row already exists and Publish/Unpublish is a command
	 * against it. Either way `is_published` is never a field — `updateDocumentDetails` has no
	 * such field to send it to, and ADR 0001 gives create no exemption.
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
	actions?: (state: { values: DocumentDetailValues }) => React.ReactNode;
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
		defaultValues,
		// The publish decision travels with the submit rather than living in the values, so both
		// create buttons run the same validation and the form has no publish state to leave on.
		onSubmit: async ({ value, meta }) => {
			await onSubmit({ ...value, is_published: meta.publish });
		},
		onSubmitMeta: { publish: false },
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
				<form.SubmitFormButton className="w-full" label={submitLabel} />
				{mode === "create" ? (
					// Disabled on the same condition as the draft button, and that matters more
					// here than there: this is the irreversible half of the pair. Leaving the
					// public act clickable while the safe one is greyed out inverts the guard.
					<form.Subscribe selector={(state) => state.canSubmit}>
						{(canSubmit) => (
							<LifecycleButton
								className="w-full"
								disabled={!canSubmit}
								label="Create and Publish"
								onAct={() => form.handleSubmit({ publish: true })}
							/>
						)}
					</form.Subscribe>
				) : null}
				{actions ? (
					<form.Subscribe selector={(state) => state.values}>
						{(values) => actions({ values })}
					</form.Subscribe>
				) : null}
			</form.FormWrapper>
		</form.AppForm>
	);
}
