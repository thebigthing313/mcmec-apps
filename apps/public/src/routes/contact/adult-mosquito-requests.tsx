import {
	AdultMosquitoRequestsRowSchema,
	type AdultMosquitoRequestsRowType,
} from "@mcmec/supabase/db/adult-mosquito-requests";
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
import { submitAdultMosquitoRequestServerFn } from "@/src/lib/submit-adult-mosquito-request";
export const Route = createFileRoute("/contact/adult-mosquito-requests")({
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
	const submitForm = useServerFn(submitAdultMosquitoRequestServerFn);

	const zipCodeOptions: ComboboxOption[] = zipCodes.map((zipCode) => ({
		label: `${zipCode.city}, NJ ${zipCode.code}`,
		value: zipCode.id,
	}));

	const defaultValues: AdultMosquitoRequestsRowType = {
		additional_details: null,
		address_line_1: "",
		address_line_2: null,
		created_at: new Date(),
		created_by: null,
		email: null,
		full_name: "",
		id: crypto.randomUUID() as string,
		is_accessible: true,
		is_daytime: false,
		is_dusk_dawn: false,
		is_front_of_property: false,
		is_general_vicinity: false,
		is_nighttime: false,
		is_processed: false,
		is_rear_of_property: false,
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
		validators: { onSubmit: AdultMosquitoRequestsRowSchema },
	});

	return (
		<div className="mx-auto w-full max-w-7xl p-4">
			<article className="prose lg:prose-xl max-w-none">
				<h1>Adult Mosquito Nuisance Request</h1>
				<p>
					Use this form to report a high number of adult mosquitoes on your
					property or in your immediate area. Our team will review your
					submission and respond as soon as possible. Please provide as much
					detail as possible to help us address your concern effectively.
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
						</form.AppField>{" "}
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
						<FieldSet>
							<FieldLegend>Location of Mosquito Problem</FieldLegend>
							<FieldDescription>
								Where are you seeing mosquitoes? (Check all that apply)
							</FieldDescription>

							<form.AppField
								name="is_front_of_property"
								validators={{
									onChange: ({ value, fieldApi }) => {
										if (
											!isOneChecked([
												value,
												fieldApi.form.getFieldValue("is_rear_of_property"),
												fieldApi.form.getFieldValue("is_general_vicinity"),
											])
										) {
											return "At least one location option must be selected.";
										}
										return undefined;
									},
									onChangeListenTo: [
										"is_rear_of_property",
										"is_general_vicinity",
									],
								}}
							>
								{(field) => <field.CheckboxField label="Front of Property" />}
							</form.AppField>
							<form.AppField name="is_rear_of_property">
								{(field) => <field.CheckboxField label="Rear of Property" />}
							</form.AppField>
							<form.AppField name="is_general_vicinity">
								{(field) => (
									<field.CheckboxField label="General Vicinity of Property" />
								)}
							</form.AppField>
						</FieldSet>
						<form.AppField name="is_accessible">
							{(field) => (
								<field.SwitchField
									description="Inspections are conducted between 7am-3:30pm. You do not need to be home during an inspection. Can we access your backyard even if you are not home?"
									label="Access to Premises"
									labelWhenFalse="No, I have a locked gate and/or an outdoor pet. Please call to make arrangements for inspection."
									labelWhenTrue="Yes, you may access the property even if we are not home."
									orientation="vertical"
								/>
							)}
						</form.AppField>
					</FieldSet>
					<FieldSeparator />
					<FieldSet>
						<FieldLegend>Timing of Mosquito Problem</FieldLegend>
						<FieldDescription>
							When are you seeing mosquitoes? (Check all that apply)
						</FieldDescription>
						<form.AppField
							name="is_dusk_dawn"
							validators={{
								onChange: ({ value, fieldApi }) => {
									if (
										!isOneChecked([
											value,
											fieldApi.form.getFieldValue("is_daytime"),
											fieldApi.form.getFieldValue("is_nighttime"),
										])
									) {
										return "At least one time of day must be selected.";
									}

									return undefined;
								},
								onChangeListenTo: ["is_daytime", "is_nighttime"],
							}}
						>
							{(field) => <field.CheckboxField label="Dusk/Dawn" />}
						</form.AppField>
						<form.AppField name="is_daytime">
							{(field) => <field.CheckboxField label="Daytime" />}
						</form.AppField>
						<form.AppField name="is_nighttime">
							{(field) => <field.CheckboxField label="Nighttime" />}
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
