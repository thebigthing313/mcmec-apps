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
import z from "zod";

const searchSchema = z.object({
	redirect: z.string().optional(),
});

export const Route = createFileRoute("/_auth/login")({
	component: LoginPage,
	validateSearch: searchSchema,
});

function LoginPage() {
	const { supabase } = Route.useRouteContext();
	const navigate = useNavigate();
	const { redirect: redirectTo } = Route.useSearch();

	const form = useAppForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			// Use signInWithPassword directly to get the session tokens
			const { data, error } = await supabase.auth.signInWithPassword({
				email: value.email,
				password: value.password,
			});
			if (error || !data.session) {
				console.error("Sign-in failed:", error);
				return;
			}
			if (
				redirectTo?.startsWith("http") &&
				!redirectTo.startsWith(window.location.origin)
			) {
				const isProduction = window.location.hostname.includes(
					"middlesexmosquito.org",
				);
				if (isProduction) {
					// Production: PKCE + shared cookie handles session — just redirect
					window.location.href = redirectTo;
				} else {
					// Dev: pass session tokens in hash since cookies don't share across ports
					window.location.href = `${redirectTo}#access_token=${data.session.access_token}&refresh_token=${data.session.refresh_token}&type=bearer`;
				}
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
