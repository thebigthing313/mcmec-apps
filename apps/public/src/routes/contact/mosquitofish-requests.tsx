import {
	MosquitoFishFormSchema,
	type MosquitoFishFormType,
	toContactPayload,
} from "@mcmec/schemas/db/public-requests";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldLabel,
	FieldLegend,
	FieldSeparator,
	FieldSet,
} from "@mcmec/ui/components/field";
import { Input } from "@mcmec/ui/components/input";
import { useAppForm } from "@mcmec/ui/forms/form-context";
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
import { canonical, seo } from "@/src/lib/seo";
import { submitPublicRequestServerFn } from "@/src/lib/submit-public-request";
import {
	findServicedZipCode,
	servicedZipCodeValidator,
} from "@/src/lib/zip-codes";

export const Route = createFileRoute("/contact/mosquitofish-requests")({
	component: RouteComponent,
	head: () => ({
		meta: seo({
			title: "Mosquitofish Request - MCMEC",
			description:
				"Request mosquitofish for natural mosquito larvae control in ornamental ponds and contained water bodies.",
			url: "/contact/mosquitofish-requests",
		}),
		links: [canonical("/contact/mosquitofish-requests")],
	}),
	loader: ({ context }) => {
		return context.queryClient.ensureQueryData(zipCodesQueryOptions());
	},
});

function RouteComponent() {
	const sitekey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITEKEY;
	const [honeypot, setHoneypot] = useState<string>("");
	const [turnstileToken, setTurnstileToken] = useState<string>("");
	const turnstileRef = useRef<TurnstileWidgetRef>(null);
	const navigate = useNavigate();

	const { data: zipCodes } = useSuspenseQuery(zipCodesQueryOptions());
	const submitForm = useServerFn(submitPublicRequestServerFn);

	const defaultValues: MosquitoFishFormType = {
		additional_details: null,
		address_line_1: "",
		address_line_2: null,
		email: null,
		full_name: "",
		location_of_water_body: "",
		phone: "",
		type_of_water_body: "",
		zip_code: "",
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

			// The typed code was validated against the serviced list as the resident typed it;
			// this resolves it to the row id the payload actually carries.
			const zipCode = findServicedZipCode(zipCodes, value.zip_code);
			if (!zipCode) {
				toast.error("Please enter a zip code within our service area.");
				return;
			}

			const result = await submitForm({
				data: {
					honeypot,
					request: {
						...toContactPayload(value, zipCode.id),
						details: {
							additionalDetails: value.additional_details || undefined,
							locationOfWaterBody: value.location_of_water_body,
							typeOfWaterBody: value.type_of_water_body,
						},
						requestType: "mosquito_fish",
					},
					turnstileToken,
				},
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
		},
		validationLogic: revalidateLogic({
			mode: "submit",
			modeAfterSubmission: "change",
		}),
		validators: { onDynamic: MosquitoFishFormSchema },
	});

	return (
		<div className="flex flex-col gap-4">
			<article className="prose lg:prose-base max-w-none">
				<h1>Mosquitofish Request</h1>
				<p>
					Mosquitofish are small fish that feed on mosquito larvae and can be an
					effective natural control method for standing water on your property.
					Use this form to request mosquitofish for a contained body of water
					such as an ornamental pond, fountain, or similar feature. Please note
					that our entomologist will first assess the potential habitat prior to
					any fish stocking.
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
								<field.TextField
									autoComplete="name"
									label="Full Name"
									required
								/>
							)}
						</form.AppField>
						<form.AppField name="phone">
							{(field) => <field.PhoneField label="Phone" required />}
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
									label="Address Line 1"
									required
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
						{/*
						 * A plain postal-code input, not a combobox over the serviced zip codes.
						 * The browser is already autofilling the two fields above it, and a
						 * combobox in the postal-code slot fought that autofill on every
						 * submission. The serviced-area check moved into a validator, which says
						 * so in words instead of leaving the resident hunting an absent option.
						 */}
						<form.AppField
							name="zip_code"
							validators={{ onDynamic: servicedZipCodeValidator(zipCodes) }}
						>
							{(field) => {
								const servicedZipCode = findServicedZipCode(
									zipCodes,
									field.state.value,
								);
								const cityDisplay = servicedZipCode
									? `${servicedZipCode.city}, ${servicedZipCode.state}`
									: "";

								return (
									<div className="flex w-full flex-row flex-wrap items-center justify-between gap-4">
										<field.TextField
											autoComplete="postal-code"
											className="w-42"
											inputMode="numeric"
											label="Zip Code"
											maxLength={5}
											required
										/>

										{/*
										 * Derived from the typed zip code, not entered. It still needs a
										 * real label association: without htmlFor/id this read-only input
										 * reached assistive technology unnamed, like the zip field
										 * beside it once did.
										 */}
										<Field className="flex-1">
											<FieldLabel htmlFor="city-display">City</FieldLabel>
											<FieldContent>
												<Input id="city-display" readOnly value={cityDisplay} />
											</FieldContent>
										</Field>
									</div>
								);
							}}
						</form.AppField>
					</FieldSet>
					<FieldSeparator />
					<FieldSet>
						<FieldLegend>Water Body Information</FieldLegend>
						<form.AppField name="type_of_water_body">
							{(field) => (
								<field.TextAreaField
									className="max-w-2xl"
									description="Please describe the water body. Include details like estimated
							depth, volume, etc."
									label="Type of Water Body"
									required
								/>
							)}
						</form.AppField>

						<form.AppField name="location_of_water_body">
							{(field) => (
								<field.TextAreaField
									className="max-w-2xl"
									description="Please describe the location in detail. Include addresses, intersections, coordinates, etc. if applicable."
									label="Location of Water Body"
									required
								/>
							)}
						</form.AppField>
					</FieldSet>

					<form.AppField name="additional_details">
						{(field) => (
							<field.TextAreaField
								className="max-w-2xl"
								description="Please enter any other relevant information."
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

					<form.AppForm>
						<form.SubmitFormButton className="w-full" label="Submit Request" />
					</form.AppForm>
				</form.FormWrapper>
			</form.AppForm>
		</div>
	);
}
