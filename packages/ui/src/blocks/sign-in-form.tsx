import type { AuthClient } from "@mcmec/auth/client";
import { signIn } from "@mcmec/auth/signIn";
import {
	PasswordSchema,
	ValidEmailSchema,
} from "@mcmec/lib/constants/validators";
import { useState } from "react";
import { useAppForm } from "../forms/form-context";
import {
	AuthActions,
	AuthFieldset,
	AuthHeading,
	AuthStatus,
} from "./auth-shell";

interface SignInFormProps {
	authClient: AuthClient;
	/**
	 * Where to go once the cookie is set. The session cookie is shared across every MCMEC
	 * application, so there is no token to hand off — each app just decides where "in" is.
	 */
	onSignedIn: () => void;
	/** The app's own route to password recovery. Rendered opposite the action. */
	forgotPassword?: React.ReactNode;
}

/**
 * The sign-in screen, shared by all four staff applications.
 *
 * This used to be four near-identical copies — three hand-rolled `useState` forms plus central's
 * TanStack one — which is how four applications that share an account, a cookie and a design
 * system came to have four front doors. The differences between them were never decisions.
 */
export function SignInForm({
	authClient,
	onSignedIn,
	forgotPassword,
}: SignInFormProps) {
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
				// Deliberately does not say which half was wrong.
				setError("That email and password don't match an account.");
				return;
			}
			onSignedIn();
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<AuthHeading
				description="One account reaches every Commission application."
				title="Sign in"
			/>

			<AuthFieldset>
				<form.AppField name="email" validators={{ onBlur: ValidEmailSchema }}>
					{(field) => (
						<field.TextField
							autoComplete="username"
							label="Email"
							type="email"
						/>
					)}
				</form.AppField>

				<form.AppField name="password" validators={{ onBlur: PasswordSchema }}>
					{(field) => (
						<field.PasswordField
							autoComplete="current-password"
							label="Password"
						/>
					)}
				</form.AppField>
			</AuthFieldset>

			<AuthStatus>{error}</AuthStatus>

			<AuthActions aside={forgotPassword}>
				<form.AppForm>
					<form.SubmitFormButton label="Sign in" />
				</form.AppForm>
			</AuthActions>
		</form>
	);
}
