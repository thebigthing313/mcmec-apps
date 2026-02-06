import {
	NonEmptyStringSchema,
	ValidEmailSchema,
} from "@mcmec/lib/constants/validators";
import { ContactFormSubmissionsInsertSchema } from "@mcmec/supabase/db/contact-form-submissions";
import { useAppForm } from "@mcmec/ui/forms/form-context";
import { ClientOnly, createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
	TurnstileWidget,
	type TurnstileWidgetRef,
} from "@/src/components/turnstile-widget";
import { submitContactFormServerFn } from "@/src/lib/submit-contact-form";

export const Route = createFileRoute("/contact/contact-us")({
	component: RouteComponent,
});

function RouteComponent() {
	const sitekey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITEKEY;
	const [honeypot, setHoneypot] = useState<string>("");
	const [turnstileToken, setTurnstileToken] = useState<string>("");
	const turnstileRef = useRef<TurnstileWidgetRef>(null);

	// Wrap callback in useCallback to keep it stable and prevent widget re-renders
	const handleTurnstileSuccess = useCallback((token: string) => {
		setTurnstileToken(token);
	}, []);

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
			if (honeypot) {
				toast.info("Submission successful! Thank you for contacting us.");
				form.reset();
				return;
			}

			// Validate turnstile token is present
			if (!turnstileToken) {
				toast.error("Please complete the security verification.");
				return;
			}

			const result = await submitForm({
				data: { data: { ...value }, turnstileToken },
			});

			// Reset token and turnstile widget after submission attempt
			setTurnstileToken("");
			turnstileRef.current?.reset();

			if (result.success) {
				toast.success("Submission successful! Thank you for contacting us.");
				form.reset();
			} else {
				toast.error(
					result.error ||
						"There was an error submitting the form. Please try again.",
				);
			}
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
					<Link to="/contact/service-request">service request</Link> page.
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
					<form.AppField
						name="email"
						validators={{ onSubmit: ValidEmailSchema }}
					>
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
					<ClientOnly fallback={<div className="h-16.25" />}>
						<TurnstileWidget
							key={sitekey} // Force re-mount if sitekey changes
							onSuccess={handleTurnstileSuccess}
							ref={turnstileRef}
							sitekey={sitekey}
						/>
					</ClientOnly>
					<form.AppForm>
						<form.SubmitFormButton className="w-full" />
					</form.AppForm>

					<input
						name="nickname"
						onChange={(e) => setHoneypot(e.target.value)}
						style={{ display: "none" }}
						type="text"
						value={honeypot}
					/>
				</form.FormWrapper>
			</form.AppForm>
		</div>
	);
}
