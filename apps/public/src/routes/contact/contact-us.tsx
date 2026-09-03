import {
	NonEmptyStringSchema,
	ValidEmailSchema,
} from "@mcmec/lib/constants/validators";
import { GeneralInquirySubmissionSchema } from "@mcmec/schemas/db/public-requests";
import { useAppForm } from "@mcmec/ui/forms/form-context";
import { ClientOnly, createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
	TurnstileWidget,
	type TurnstileWidgetRef,
} from "@/src/components/turnstile-widget";
import { canonical, seo } from "@/src/lib/seo";
import { submitPublicRequestServerFn } from "@/src/lib/submit-public-request";

// The form is flat; the API takes { name, email, details: { subject, message } }. Same
// constraints, one level up — see GeneralInquirySubmissionSchema.
const ContactFormSchema = z.object({
	email: GeneralInquirySubmissionSchema.shape.email,
	message: GeneralInquirySubmissionSchema.shape.details.shape.message,
	name: GeneralInquirySubmissionSchema.shape.name,
	subject: GeneralInquirySubmissionSchema.shape.details.shape.subject,
});

export const Route = createFileRoute("/contact/contact-us")({
	component: RouteComponent,
	head: () => ({
		meta: seo({
			title: "Contact Us - MCMEC",
			description:
				"Get in touch with the Middlesex County Mosquito Extermination Commission.",
			url: "/contact/contact-us",
		}),
		links: [canonical("/contact/contact-us")],
	}),
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

	const submitForm = useServerFn(submitPublicRequestServerFn);
	const form = useAppForm({
		defaultValues: {
			email: "",
			message: "",
			name: "",
			subject: "",
		},
		onSubmit: async ({ value }) => {
			if (honeypot) {
				toast.info("Thank you — your message has been sent.");
				form.reset();
				return;
			}

			// Validate turnstile token is present
			if (!turnstileToken) {
				toast.error("Please complete the security verification.");
				return;
			}

			const result = await submitForm({
				data: {
					honeypot,
					request: {
						details: { message: value.message, subject: value.subject },
						email: value.email,
						name: value.name,
						requestType: "general_inquiry",
					},
					turnstileToken,
				},
			});

			// Reset token and turnstile widget after submission attempt
			setTurnstileToken("");
			turnstileRef.current?.reset();

			if (result.success) {
				toast.success("Thank you — your message has been sent.");
				form.reset();
			} else {
				toast.error(
					result.error ||
						"There was an error submitting the form. Please try again.",
				);
			}
		},
		validators: {
			// Flattened from the API's general_inquiry contract, so bad input surfaces
			// before the round trip.
			onSubmit: ContactFormSchema,
		},
	});

	return (
		<div className="mx-auto w-full max-w-7xl p-4">
			<article className="prose lg:prose-base max-w-none">
				<h1>Contact Us</h1>
				<p>
					The Middlesex County Mosquito Extermination Commission is dedicated to
					protecting our residents from mosquito-borne diseases and maintaining
					a high quality of life through effective Integrated Pest Management.
					Whether you have questions regarding our surveillance programs, public
					outreach, or current spray schedules, our office in Edison is here to
					assist you. If you would like to report a mosquito problem, water
					management issue, or request mosquitofish, please use our dedicated{" "}
					<Link to="/contact/service-request">Public Request</Link> page.
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
