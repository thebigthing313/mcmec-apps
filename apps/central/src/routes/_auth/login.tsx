import { signIn } from "@mcmec/auth/signIn";
import {
	PasswordSchema,
	ValidEmailSchema,
} from "@mcmec/lib/constants/validators";
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

const searchSchema = z.object({
	// Same-origin paths only — an absolute URL here would bounce a freshly
	// authenticated user off-site. Sibling apps have their own /login now.
	redirect: z
		.string()
		.refine((v) => v.startsWith("/") && !v.startsWith("//"))
		.optional()
		.catch(undefined),
});

export const Route = createFileRoute("/_auth/login")({
	component: LoginPage,
	validateSearch: searchSchema,
});

function LoginPage() {
	const { authClient } = Route.useRouteContext();
	const navigate = useNavigate();
	const { redirect: redirectTo } = Route.useSearch();
	const [error, setError] = useState<string | null>(null);

	const form = useAppForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			setError(null);
			try {
				await signIn({
					client: authClient,
					email: value.email,
					password: value.password,
				});
			} catch {
				setError("Invalid email or password.");
				return;
			}
			// The session cookie is shared across every MCMEC app, so there's nothing to hand
			// off — the old token-in-the-hash dance for sibling apps is gone.
			if (redirectTo) {
				window.location.href = redirectTo;
			} else {
				navigate({ to: "/" });
			}
		},
	});

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
						<FieldLegend>Sign In</FieldLegend>
						<FieldDescription>
							Enter your credentials to access the portal.
						</FieldDescription>
						<FieldGroup>
							<form.AppField
								name="email"
								validators={{ onBlur: ValidEmailSchema }}
							>
								{(field) => <field.TextField label="Email" />}
							</form.AppField>

							<form.AppField
								name="password"
								validators={{ onBlur: PasswordSchema }}
							>
								{(field) => <field.PasswordField label="Password" />}
							</form.AppField>

							{error && (
								<p className="text-red-600 text-sm" role="alert">
									{error}
								</p>
							)}

							<form.AppForm>
								<form.SubmitFormButton className="w-full" label="Sign In" />
							</form.AppForm>

							<Link
								className="text-center text-muted-foreground text-sm underline hover:text-foreground"
								to="/forgot-password"
							>
								Forgot password?
							</Link>
						</FieldGroup>
					</FieldSet>
				</form>
			</CardContent>
		</Card>
	);
}
