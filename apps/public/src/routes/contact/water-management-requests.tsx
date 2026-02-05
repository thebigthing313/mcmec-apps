import {
	WaterManagementRequestsRowSchema,
	type WaterManagementRequestsRowType,
} from "@mcmec/supabase/db/water-management-requests";
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
import { submitWaterManagementRequestServerFn } from "@/src/lib/submit-water-management-request";

export const Route = createFileRoute("/contact/water-management-requests")({
	component: RouteComponent,
	loader: ({ context }) => {
		return context.queryClient.ensureQueryData(zipCodesQueryOptions());
	},
});

function isOneChecked(entries: Array<boolean>) {
	return entries.some((entry) => entry === true);
}

function RouteComponent() {
	const sitekey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITEKEY;
	const [honeypot, setHoneypot] = useState<string>("");
	const [turnstileToken, setTurnstileToken] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const turnstileRef = useRef<TurnstileWidgetRef>(null);
	const navigate = useNavigate();

	const { data: zipCodes } = useSuspenseQuery(zipCodesQueryOptions());
	const submitForm = useServerFn(submitWaterManagementRequestServerFn);

	const zipCodeOptions: ComboboxOption[] = zipCodes.map((zipCode) => ({
		label: `${zipCode.city}, NJ ${zipCode.code}`,
		value: zipCode.id,
	}));

	const defaultValues: WaterManagementRequestsRowType = {
		additional_details: null,
		address_line_1: "",
		address_line_2: null,
		created_at: new Date(),
		created_by: null,
		email: null,
		full_name: "",
		id: crypto.randomUUID() as string,
		is_on_my_property: false,
		is_on_neighbor_property: false,
		is_on_public_property: false,
		is_processed: false,
		other_location_description: null,
		phone: "",
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
		validators: { onSubmit: WaterManagementRequestsRowSchema },
	});

	return (
		<div className="mx-auto w-full max-w-7xl p-4">
			<article className="prose lg:prose-xl max-w-none">
				<h1>Water Management Request</h1>
				<p>
					Please use this form to report significant areas of blocked waterways,
					poor drainage, or other persistent water issues that you believe may
					be serving as mosquito breeding habitats.
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
						<FieldLegend>Where is the standing water located?</FieldLegend>
						<FieldDescription>Check all that apply</FieldDescription>

						<form.AppField
							name="is_on_my_property"
							validators={{
								onChange: ({ value, fieldApi }) => {
									const hasCheckbox = isOneChecked([
										value,
										fieldApi.form.getFieldValue("is_on_neighbor_property"),
										fieldApi.form.getFieldValue("is_on_public_property"),
									]);
									const hasOtherDescription = fieldApi.form.getFieldValue(
										"other_location_description",
									);

									if (!hasCheckbox && !hasOtherDescription) {
										return "At least one location option must be selected or provide other location description.";
									}
									return undefined;
								},
								onChangeListenTo: [
									"is_on_neighbor_property",
									"is_on_public_property",
									"other_location_description",
								],
							}}
						>
							{(field) => <field.CheckboxField label="On My Property" />}
						</form.AppField>
						<form.AppField name="is_on_neighbor_property">
							{(field) => (
								<field.CheckboxField label="On Neighbor's Property" />
							)}
						</form.AppField>
						<form.AppField name="is_on_public_property">
							{(field) => <field.CheckboxField label="On Public Property" />}
						</form.AppField>
					</FieldSet>

					<form.AppField
						name="other_location_description"
						validators={{
							onChange: ({ value, fieldApi }) => {
								const hasCheckbox = isOneChecked([
									fieldApi.form.getFieldValue("is_on_my_property"),
									fieldApi.form.getFieldValue("is_on_neighbor_property"),
									fieldApi.form.getFieldValue("is_on_public_property"),
								]);

								if (!hasCheckbox && !value) {
									return "At least one location option must be selected or provide other location description.";
								}
								return undefined;
							},
							onChangeListenTo: [
								"is_on_my_property",
								"is_on_neighbor_property",
								"is_on_public_property",
							],
						}}
					>
						{(field) => (
							<field.TextAreaField
								className="max-w-2xl"
								label="Other Location Description (Optional)"
							/>
						)}
					</form.AppField>

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
