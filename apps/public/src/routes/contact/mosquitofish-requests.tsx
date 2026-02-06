import {
	MosquitofishRequestsRowSchema,
	type MosquitofishRequestsRowType,
} from "@mcmec/supabase/db/mosquitofish-requests";
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
	const turnstileRef = useRef<TurnstileWidgetRef>(null);
	const navigate = useNavigate();

	const { data: zipCodes } = useSuspenseQuery(zipCodesQueryOptions());
	const submitForm = useServerFn(submitMosquitofishRequestServerFn);

	const zipCodeOptions: ComboboxOption[] = zipCodes.map((zipCode) => ({
		label: zipCode.code,
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
		},
		validationLogic: revalidateLogic({
			mode: "submit",
			modeAfterSubmission: "change",
		}),
		validators: { onDynamic: MosquitofishRequestsRowSchema },
	});

	return (
		<div className="mx-auto w-full max-w-7xl p-4">
			<article className="prose lg:prose-xl max-w-none">
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
							{(field) => {
								const selectedZipCode = zipCodes.find(
									(zc) => zc.id === field.state.value,
								);
								const cityDisplay = selectedZipCode
									? `${selectedZipCode.city}, NJ`
									: "";

								return (
									<div className="flex w-full flex-row flex-wrap items-center justify-between gap-4">
										<field.AutocompleteField
											className="w-42"
											emptyMessage="No zip code found."
											items={zipCodeOptions}
											label="Zip Code *"
											placeholder="Enter zip code..."
										/>

										<Field className="flex-1">
											<FieldLabel>City</FieldLabel>
											<FieldContent>
												<Input readOnly value={cityDisplay} />
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
									label="Type of Water Body *"
								/>
							)}
						</form.AppField>

						<form.AppField name="location_of_water_body">
							{(field) => (
								<field.TextAreaField
									className="max-w-2xl"
									description="Please describe the location in detail. Include addresses, intersections, coordinates, etc. if applicable."
									label="Location of Water Body *"
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
