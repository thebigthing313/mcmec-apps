import {
	NonEmptyDateSchema,
	NonEmptyStringSchema,
	NonEmptyUUID,
} from "@mcmec/lib/constants/validators";
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

/** What the form submits. Creating a notice is the one place the publish state is a choice. */
export type NoticeFormValues = NoticeDetailValues & { is_published: boolean };

interface NoticeFormProps {
	defaultValues: NoticeDetailValues;
	onSubmit: (value: NoticeFormValues) => void | Promise<void>;
	categories: Array<{ label: string; value: string }>;
	formLabel: string;
	submitLabel: string;
	/**
	 * Create offers the initial publish state; edit moves it to a Publish/Unpublish action, and
	 * the field is then neither rendered nor read — `updateNoticeDetails` has no such field to
	 * send it to.
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
	actions?: (state: { values: NoticeFormValues }) => React.ReactNode;
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
		defaultValues: { ...defaultValues, is_published: true },
		onSubmit: async ({ value }) => {
			await onSubmit(value);
		},
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
				{mode === "create" ? (
					<form.AppField name="is_published">
						{(field) => (
							<field.SwitchField
								description="Mark notice as ready to publish or as a draft"
								label="Publish Status"
								labelWhenFalse="This notice is a draft and will never display in the legal notices pages."
								labelWhenTrue="This notice is published and will display in the legal notices pages once the publish date is reached."
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
