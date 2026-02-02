import {
	EmailSchema,
	NonEmptyStringSchema,
} from "@mcmec/lib/constants/validators";
import { ContactFormSubmissionsInsertSchema } from "@mcmec/supabase/db/contact-form-submissions";
import { useAppForm } from "@mcmec/ui/forms/form-context";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { submitContactFormServerFn } from "@/src/lib/submit-contact-form";

export const Route = createFileRoute("/(contact)/contact-us")({
	component: RouteComponent,
});

function RouteComponent() {
	const submitForm = useServerFn(submitContactFormServerFn);
	const form = useAppForm({
		defaultValues: {
			email: "",
			id: crypto.randomUUID() as string,
			is_closed: false,
			message: "",
			name: "",
			subject: "",
		},
		onSubmit: async ({ value }) => {
			await submitForm({ data: { ...value } });
		},
		validators: {
			onSubmit: ContactFormSubmissionsInsertSchema,
		},
	});

	return (
		<div className="mx-auto w-full max-w-7xl p-4">
			<article className="prose lg:prose-xl max-w-none">
				<h1>Contact Us</h1>
				<p>
					The Middlesex County Mosquito Extermination Commission is dedicated to
					protecting our residents from mosquito-borne diseases and maintaining
					a high quality of life through effective Integrated Pest Management.
					Whether you have questions regarding our surveillance programs, public
					outreach, or current spray schedules, our office in Edison is here to
					assist you. If you would like to report a mosquito problem, water
					management issue, or request mosquito fish, please use our dedicated{" "}
					<Link to="/service">service request</Link> page.
				</p>
			</article>

			<form.AppForm>
				<form.FormWrapper className="mt-4 max-w-2xl">
					<form.AppField
						name="name"
						validators={{ onSubmit: NonEmptyStringSchema(2) }}
					>
						{(field) => <field.TextField label="Name" />}
					</form.AppField>
					<form.AppField name="email" validators={{ onSubmit: EmailSchema }}>
						{(field) => <field.TextField label="Email" />}
					</form.AppField>
					<form.AppField
						name="subject"
						validators={{ onSubmit: NonEmptyStringSchema(2) }}
					>
						{(field) => <field.TextField label="Subject" />}
					</form.AppField>
					<form.AppField
						name="message"
						validators={{
							onBlur: NonEmptyStringSchema(5).max(
								1000,
								"Message cannot exceed 1000 characters",
							),
						}}
					>
						{(field) => (
							<field.TextAreaField className="max-w-2xl" label="Message" />
						)}
					</form.AppField>
					<form.SubmitFormButton className="w-full" label="Submit Form" />
				</form.FormWrapper>
			</form.AppForm>
		</div>
	);
}
