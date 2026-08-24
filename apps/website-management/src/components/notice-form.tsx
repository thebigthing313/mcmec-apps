import {
	NonEmptyDateSchema,
	NonEmptyStringSchema,
	NonEmptyUUID,
} from "@mcmec/lib/constants/validators";
import { useAppForm } from "@mcmec/ui/forms/form-context";

/**
 * The details of a notice — exactly the fields `website.updateNoticeDetails` accepts, plus the
 * initial publish state a create is allowed to choose.
 *
 * `is_archived` is gone from this form. Archiving is a named command with a legal precondition
 * on it, so it is an action on the notice, not a switch inside an edit form — which is also
 * what lets the server enforce P.L. 2025 c.72 instead of warning about it.
 */
export interface NoticeFormValues {
	notice_type_id: string;
	title: string;
	notice_date: Date;
	content: string;
	is_published: boolean;
}

interface NoticeFormProps {
	defaultValues: NoticeFormValues;
	onSubmit: (value: NoticeFormValues) => void | Promise<void>;
	categories: Array<{ label: string; value: string }>;
	formLabel: string;
	submitLabel: string;
	/** Create offers the initial publish state; edit moves it to a Publish/Unpublish action. */
	mode: "create" | "edit";
}

export function NoticeForm({
	defaultValues,
	onSubmit,
	categories,
	formLabel,
	submitLabel,
	mode,
}: NoticeFormProps) {
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
			</form.FormWrapper>
		</form.AppForm>
	);
}
