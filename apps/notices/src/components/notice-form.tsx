import {
	NonEmptyDateSchema,
	NonEmptyStringSchema,
	NonEmptyUUID,
} from "@mcmec/lib/constants/validators";
import {
	NoticesRowSchema,
	type NoticesRowType,
} from "@mcmec/supabase/db/notices";
import { useAppForm } from "@mcmec/ui/forms/form-context";

interface NoticeFormProps {
	defaultValues: {
		id: string;
		notice_type_id: string;
		title: string;
		notice_date: Date;
		content: string;
		is_published: boolean;
		is_archived: boolean;
		created_at: Date;
		created_by: string | null;
		updated_at: Date;
		updated_by: string | null;
	};
	onSubmit: (value: NoticesRowType) => void | Promise<void>;
	categories: Array<{ label: string; value: string }>;
	formLabel: string;
	submitLabel: string;
}

export function NoticeForm({
	defaultValues,
	onSubmit,
	categories,
	formLabel,
	submitLabel,
}: NoticeFormProps) {
	const form = useAppForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			const parsedValue = NoticesRowSchema.parse(value);
			await onSubmit(parsedValue);
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
				<form.AppField name="is_archived">
					{(field) => (
						<field.SwitchField
							description="Indicates whether the notice is archived or active. Archived notices are notices whose information is no longer current but are kept for historical reference."
							label="Archive Status"
							labelWhenFalse="This notice is active and will display in the current legal notices page."
							labelWhenTrue="This notice is no longer active and will display in the archived notices page."
							orientation="vertical"
						/>
					)}
				</form.AppField>
				<form.SubmitFormButton className="w-full" label={submitLabel} />
			</form.FormWrapper>
		</form.AppForm>
	);
}
