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
			<form.FormWrapper formLabel={formLabel} className="max-w-2xl">
				<form.AppField name="title">
					{(field) => <field.TextField label="Title" />}
				</form.AppField>
				<form.AppField name="notice_type_id">
					{(field) => (
						<field.ComboboxField
							label="Notice Type"
							options={categories}
							placeholder="Select notice type..."
						/>
					)}
				</form.AppField>
				<form.AppField name="notice_date">
					{(field) => (
						<field.DateTimeField
							label="Notice Date"
							showTimeInput={false}
							placeholder="Select date"
						/>
					)}
				</form.AppField>
				<form.AppField name="content">
					{(field) => <field.ContentField label="Content" />}
				</form.AppField>
				<form.AppField name="is_published">
					{(field) => <field.SwitchField label="Published" />}
				</form.AppField>
				<form.SubmitFormButton label={submitLabel} className="w-full" />
			</form.FormWrapper>
		</form.AppForm>
	);
}
