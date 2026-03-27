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

export const Route = createFileRoute("/_auth/reset-password")({
	component: ResetPasswordPage,
});

function ResetPasswordPage() {
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
			setTimeout(() => navigate({ to: "/login" }), 2000);
		},
	});

	if (status === "success") {
		return (
			<Card>
				<CardContent>
					<div className="flex flex-col gap-4 text-center">
						<h2 className="font-bold text-xl">Password Updated</h2>
						<p className="text-muted-foreground">
							Your password has been reset. Redirecting to sign in...
						</p>
						<Link
							className="text-muted-foreground text-sm underline hover:text-foreground"
							to="/login"
						>
							Go to Sign In
						</Link>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
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
						<FieldLegend>Set New Password</FieldLegend>
						<FieldDescription>Enter your new password below.</FieldDescription>
						<FieldGroup>
							<form.AppField
								name="password"
								validators={{ onBlur: PasswordSchema }}
							>
								{(field) => <field.PasswordField label="New Password" />}
							</form.AppField>

							<form.AppField
								name="confirmPassword"
								validators={{
									onBlur: z.string().min(1, "Please confirm your password."),
								}}
							>
								{(field) => <field.PasswordField label="Confirm Password" />}
							</form.AppField>

							{errorMessage && (
								<p className="text-red-600 text-sm">{errorMessage}</p>
							)}

							<form.AppForm>
								<form.SubmitFormButton
									className="w-full"
									label="Reset Password"
								/>
							</form.AppForm>
						</FieldGroup>
					</FieldSet>
				</form>
			</CardContent>
		</Card>
	);
}
