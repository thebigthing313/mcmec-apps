import {
	NonEmptyDateSchema,
	NonEmptyStringSchema,
	NonEmptyUUID,
} from "@mcmec/lib/constants/validators";
import { LifecycleButton } from "@mcmec/ui/blocks/lifecycle-button";
import { useAppForm } from "@mcmec/ui/forms/form-context";

/**
 * The details of a notice — exactly the fields `website.updateNoticeDetails` accepts.
 *
 * `is_published` and `is_archived` are not here. A lifecycle column can only move through a
 * named command, so publishing and archiving are actions on the notice rather than switches
 * inside an edit form — which is also what lets the server enforce P.L. 2025 c.72 instead of
 * warning about it.
 */
export interface NoticeDetailValues {
	notice_type_id: string;
	title: string;
	notice_date: Date;
	content: string;
}

/**
 * What the form submits: the details plus the state the notice is being created in.
 *
 * `is_published` is not a field the author sets — it is decided by *which button was pressed*,
 * and the form fills it in from the submit's meta. Create offers two acts, "Create as Draft"
 * and "Create and Publish", so publishing a legal notice is always something someone chose to
 * do rather than a switch that happened to be left on.
 */
export type NoticeFormValues = NoticeDetailValues & { is_published: boolean };

interface NoticeFormProps {
	defaultValues: NoticeDetailValues;
	onSubmit: (value: NoticeFormValues) => void | Promise<void>;
	categories: Array<{ label: string; value: string }>;
	formLabel: string;
	submitLabel: string;
	/**
	 * Create renders its own "Create and Publish" beneath the primary submit; edit leaves the
	 * lifecycle to `actions`, where the row already exists and Publish/Unpublish is a command
	 * against it. Either way `is_published` is never a field — `updateNoticeDetails` has no such
	 * field to send it to, and ADR 0001 gives create no exemption.
	 */
	mode: "create" | "edit";
	/**
	 * Lifecycle actions rendered beneath the fields — ADR 0001's buttons, never fields.
	 *
	 * A render prop rather than a plain node because Save-and-X needs the form's *current*
	 * values: the caller diffs them against the live row to decide whether the label says
	 * "Publish" or "Save and Publish", and to fill the `updateNoticeDetails` half of the
	 * envelope. The form keeps owning its state; the caller borrows a read of it.
	 */
	actions?: (state: { values: NoticeDetailValues }) => React.ReactNode;
}

export function NoticeForm({
	defaultValues,
	onSubmit,
	categories,
	formLabel,
	submitLabel,
	mode,
	actions,
}: NoticeFormProps) {
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
					name="title"
					validators={{ onBlur: NonEmptyStringSchema(5) }}
				>
					{(field) => <field.TextField label="Title" />}
				</form.AppField>
				<form.AppField
					name="notice_type_id"
					validators={{
						onChange: NonEmptyUUID,
					}}
				>
					{(field) => (
						<field.ComboboxField
							label="Notice Type"
							options={categories}
							placeholder="Select notice type..."
						/>
					)}
				</form.AppField>
				<form.AppField
					name="notice_date"
					validators={{ onBlur: NonEmptyDateSchema }}
				>
					{(field) => (
						<field.DateTimeField
							description="This should be the effective date of the notice."
							label="Notice Date"
							placeholder="Select date"
							showTimeInput={false}
						/>
					)}
				</form.AppField>
				<form.AppField name="content">
					{(field) => <field.ContentField label="Content" />}
				</form.AppField>
				<form.SubmitFormButton className="w-full" label={submitLabel} />
				{mode === "create" ? (
					<LifecycleButton
						className="w-full"
						label="Create and Publish"
						onAct={() => form.handleSubmit({ publish: true })}
					/>
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
