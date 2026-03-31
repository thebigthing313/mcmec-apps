import { ValidEmailSchema } from "@mcmec/lib/constants/validators";
import { Card, CardContent } from "@mcmec/ui/components/card";
import {
	FieldDescription,
	FieldGroup,
	FieldLegend,
	FieldSet,
} from "@mcmec/ui/components/field";
import { useAppForm } from "@mcmec/ui/forms/form-context";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_auth/forgot-password")({
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	const { supabase } = Route.useRouteContext();
	const [submitted, setSubmitted] = useState(false);

	const form = useAppForm({
		defaultValues: {
			email: "",
		},
		onSubmit: async ({ value }) => {
			await supabase.auth.resetPasswordForEmail(value.email, {
				redirectTo: `${window.location.origin}/reset-password`,
			});
			setSubmitted(true);
		},
	});

	if (submitted) {
		return (
			<Card>
				<CardContent>
					<div className="flex flex-col gap-4 text-center">
						<h2 className="font-bold text-xl">Check Your Email</h2>
						<p className="text-muted-foreground">
							If an account exists with that email, you will receive a password
							reset link shortly.
						</p>
						<Link
							className="text-muted-foreground text-sm underline hover:text-foreground"
							to="/login"
						>
							Back to Sign In
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
						<FieldLegend>Reset Your Password</FieldLegend>
						<FieldDescription>
							Enter your email and we'll send you a reset link.
						</FieldDescription>
						<FieldGroup>
							<form.AppField
								name="email"
								validators={{ onBlur: ValidEmailSchema }}
							>
								{(field) => <field.TextField label="Email" />}
							</form.AppField>

							<form.AppForm>
								<form.SubmitFormButton
									className="w-full"
									label="Send Reset Link"
								/>
							</form.AppForm>

							<Link
								className="text-center text-muted-foreground text-sm underline hover:text-foreground"
								to="/login"
							>
								Back to Sign In
							</Link>
						</FieldGroup>
					</FieldSet>
				</form>
			</CardContent>
		</Card>
	);
}
