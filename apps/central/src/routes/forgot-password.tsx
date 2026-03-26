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

export const Route = createFileRoute("/forgot-password")({
	component: RouteComponent,
});

function RouteComponent() {
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
			<div className="flex min-h-svh w-full flex-col items-center justify-center gap-4 p-6 md:p-10">
				<Card className="w-full max-w-sm">
					<CardContent>
						<div className="flex flex-col gap-4 text-center">
							<h2 className="font-bold text-xl">Check Your Email</h2>
							<p className="text-gray-600">
								If an account exists with that email, you will receive a
								password reset link shortly.
							</p>
							<Link
								className="text-blue-600 underline hover:text-blue-800"
								to="/login"
							>
								Back to Login
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
								</FieldGroup>
							</FieldSet>
						</form>
					</CardContent>
				</Card>
			</div>
			<Link
				className="text-blue-600 text-sm underline hover:text-blue-800"
				to="/login"
			>
				Back to Login
			</Link>
		</div>
	);
}
