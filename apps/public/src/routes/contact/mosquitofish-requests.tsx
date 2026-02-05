import {
	MosquitofishRequestsRowSchema,
	type MosquitofishRequestsRowType,
} from "@mcmec/supabase/db/mosquitofish-requests";
import {
	FieldDescription,
	FieldLegend,
	FieldSeparator,
	FieldSet,
} from "@mcmec/ui/components/field";
import { useAppForm } from "@mcmec/ui/forms/form-context";
import type { ComboboxOption } from "@mcmec/ui/inputs/combobox-input";
import { revalidateLogic } from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
	ClientOnly,
	createFileRoute,
	useNavigate,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
	TurnstileWidget,
	type TurnstileWidgetRef,
} from "@/src/components/turnstile-widget";
import { zipCodesQueryOptions } from "@/src/lib/queries";
import { submitMosquitofishRequestServerFn } from "@/src/lib/submit-mosquitofish-request";

export const Route = createFileRoute("/contact/mosquitofish-requests")({
	component: RouteComponent,
	loader: ({ context }) => {
		return context.queryClient.ensureQueryData(zipCodesQueryOptions());
	},
});

function RouteComponent() {
	const sitekey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITEKEY;
	const [honeypot, setHoneypot] = useState<string>("");
	const [turnstileToken, setTurnstileToken] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const turnstileRef = useRef<TurnstileWidgetRef>(null);
	const navigate = useNavigate();

	const { data: zipCodes } = useSuspenseQuery(zipCodesQueryOptions());
	const submitForm = useServerFn(submitMosquitofishRequestServerFn);

	const zipCodeOptions: ComboboxOption[] = zipCodes.map((zipCode) => ({
		label: `${zipCode.city}, NJ ${zipCode.code}`,
		value: zipCode.id,
	}));

	const defaultValues: MosquitofishRequestsRowType = {
		additional_details: null,
		address_line_1: "",
		address_line_2: null,
		created_at: new Date(),
		created_by: null,
		email: null,
		full_name: "",
		id: crypto.randomUUID() as string,
		is_processed: false,
		location_of_water_body: "",
		phone: "",
		type_of_water_body: "",
		updated_at: new Date(),
		updated_by: null,
		zip_code_id: "",
	};

	const form = useAppForm({
		defaultValues: defaultValues,
		onSubmit: async ({ value }) => {
			if (honeypot) {
				await navigate({ to: "/contact/request-success" });
				return;
			}

			// Validate turnstile token is present
			if (!turnstileToken) {
				toast.error("Please complete the security verification.");
				return;
			}

			// Prevent double submissions
			if (isSubmitting) {
				return;
			}

			setIsSubmitting(true);
			try {
				const result = await submitForm({
					data: { data: { ...value }, turnstileToken },
				});

				// Reset token and turnstile widget after submission attempt
				setTurnstileToken("");
				turnstileRef.current?.reset();

				if (result.success) {
					await navigate({ to: "/contact/request-success" });
				} else {
					toast.error(
						result.error ||
							"There was an error submitting the form. Please try again.",
					);
				}
			} finally {
				setIsSubmitting(false);
			}
		},
		validationLogic: revalidateLogic({
			mode: "submit",
			modeAfterSubmission: "change",
		}),
		//@ts-expect-error Coerced date type not showing here for some reason, thinks its unknown
		validators: { onSubmit: MosquitofishRequestsRowSchema },
	});

	return (
		<div className="mx-auto w-full max-w-7xl p-4">
			<article className="prose lg:prose-xl max-w-none">
				<h1>Mosquitofish Request</h1>
				<p>
					Mosquitofish (Gambusia affinis) are small fish that feed on mosquito
					larvae and can be an effective natural control method for standing
					water on your property. Use this form to request mosquitofish for a
					contained body of water such as an ornamental pond, fountain, or
					similar feature.
				</p>
				<p>
					<strong>Important:</strong> Mosquitofish are only suitable for
					permanent, contained water features. They should not be released into
					natural waterways.
				</p>
			</article>
			<form.AppForm>
				<form.FormWrapper className="mt-4 max-w-2xl">
					<FieldSet>
						<FieldLegend>Contact Information</FieldLegend>
						<FieldDescription>
							Please provide your contact details so we can reach you if needed.
							Please note that the Commission does not accept anonymous
							requests.
						</FieldDescription>
						<form.AppField name="full_name">
							{(field) => (
								<field.TextField autoComplete="name" label="Full Name *" />
							)}
						</form.AppField>
						<form.AppField name="phone">
							{(field) => <field.PhoneField label="Phone *" />}
						</form.AppField>

						<form.AppField name="email">
							{(field) => (
								<field.TextField
									autoComplete="email"
									label="Email (Optional)"
								/>
							)}
						</form.AppField>
					</FieldSet>
					<FieldSeparator />
					<FieldSet>
						<FieldLegend>Address Information</FieldLegend>
						<FieldDescription></FieldDescription>
						<form.AppField name="address_line_1">
							{(field) => (
								<field.TextField
									autoComplete="street-address"
									label="Address Line 1 *"
								/>
							)}
						</form.AppField>
						<form.AppField name="address_line_2">
							{(field) => (
								<field.TextField
									autoComplete="address-line2"
									label="Address Line 2 (Optional)"
								/>
							)}
						</form.AppField>
						<form.AppField name="zip_code_id">
							{(field) => (
								<field.AutocompleteField
									emptyMessage="No zip code found."
									items={zipCodeOptions}
									label="Zip Code *"
									placeholder="Select zip code..."
								/>
							)}
						</form.AppField>
					</FieldSet>
					<FieldSeparator />
					<FieldSet>
						<FieldLegend>Water Body Information</FieldLegend>
						<FieldDescription>
							Please provide details about the water body where you would like
							mosquitofish placed.
						</FieldDescription>
						<form.AppField name="type_of_water_body">
							{(field) => (
								<field.TextAreaField
									className="max-w-2xl"
									label="Type of Water Body *"
								/>
							)}
						</form.AppField>

						<form.AppField name="location_of_water_body">
							{(field) => (
								<field.TextAreaField
									className="max-w-2xl"
									label="Location of Water Body *"
								/>
							)}
						</form.AppField>
					</FieldSet>

					<form.AppField name="additional_details">
						{(field) => (
							<field.TextAreaField
								className="max-w-2xl"
								label="Additional Details (Optional)"
							/>
						)}
					</form.AppField>

					{/* Honeypot field */}
					<input
						autoComplete="off"
						name="website"
						onChange={(e) => setHoneypot(e.target.value)}
						style={{ display: "none" }}
						tabIndex={-1}
						type="text"
						value={honeypot}
					/>
					<FieldSeparator />

					<ClientOnly fallback={<div className="h-16.25" />}>
						<TurnstileWidget
							onSuccess={(token) => setTurnstileToken(token)}
							ref={turnstileRef}
							sitekey={sitekey}
						/>
					</ClientOnly>

					<form.SubmitFormButton
						className="w-full"
						disabled={isSubmitting || !turnstileToken}
						label={isSubmitting ? "Submitting..." : "Submit Request"}
					/>
				</form.FormWrapper>
			</form.AppForm>
		</div>
	);
}
