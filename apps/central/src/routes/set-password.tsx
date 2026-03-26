import { PasswordSchema } from "@mcmec/lib/constants/validators";
import { Card, CardContent } from "@mcmec/ui/components/card";
import {
	FieldDescription,
	FieldGroup,
	FieldLegend,
	FieldSet,
} from "@mcmec/ui/components/field";
import { useAppForm } from "@mcmec/ui/forms/form-context";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import z from "zod";

export const Route = createFileRoute("/set-password")({
	component: RouteComponent,
});

function RouteComponent() {
	const { supabase } = Route.useRouteContext();
	const navigate = useNavigate();
	const [status, setStatus] = useState<"error" | "idle" | "success">("idle");
	const [errorMessage, setErrorMessage] = useState("");

	const form = useAppForm({
		defaultValues: {
			confirmPassword: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			if (value.password !== value.confirmPassword) {
				setStatus("error");
				setErrorMessage("Passwords do not match.");
				return;
			}

			const { error } = await supabase.auth.updateUser({
				password: value.password,
			});

			if (error) {
				setStatus("error");
				setErrorMessage(error.message);
				return;
			}

			setStatus("success");
			setTimeout(() => navigate({ to: "/" }), 2000);
		},
	});

	if (status === "success") {
		return (
			<div className="flex min-h-svh w-full flex-col items-center justify-center gap-4 p-6 md:p-10">
				<Card className="w-full max-w-sm">
					<CardContent>
						<div className="flex flex-col gap-4 text-center">
							<h2 className="font-bold text-xl">Welcome!</h2>
							<p className="text-gray-600">
								Your password has been set. Redirecting to the dashboard...
							</p>
							<Link
								className="text-blue-600 underline hover:text-blue-800"
								to="/"
							>
								Go to Dashboard
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex min-h-svh w-full flex-col items-center justify-center gap-4 p-6 md:p-10">
			<div className="w-full max-w-sm">
				<Card>
					<CardContent>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								form.handleSubmit();
							}}
						>
							<FieldSet>
								<FieldLegend>Set Your Password</FieldLegend>
								<FieldDescription>
									Welcome to MCMEC Central. Choose a password to complete your
									account setup.
								</FieldDescription>
								<FieldGroup>
									<form.AppField
										name="password"
										validators={{ onBlur: PasswordSchema }}
									>
										{(field) => <field.PasswordField label="Password" />}
									</form.AppField>

									<form.AppField
										name="confirmPassword"
										validators={{
											onBlur: z
												.string()
												.min(1, "Please confirm your password."),
										}}
									>
										{(field) => (
											<field.PasswordField label="Confirm Password" />
										)}
									</form.AppField>

									{errorMessage && (
										<p className="text-red-600 text-sm">{errorMessage}</p>
									)}

									<form.AppForm>
										<form.SubmitFormButton
											className="w-full"
											label="Set Password"
										/>
									</form.AppForm>
								</FieldGroup>
							</FieldSet>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
