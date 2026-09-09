import type { AuthClient } from "@mcmec/auth/client";
import {
	PasswordSchema,
	ValidEmailSchema,
} from "@mcmec/lib/constants/validators";
import { useState } from "react";
import z from "zod";
import { useAppForm } from "../forms/form-context";
import {
	AuthActions,
	AuthFieldset,
	AuthHeading,
	AuthStatus,
} from "./auth-shell";

/**
 * Ask for a reset link.
 *
 * Whether the address exists is not ours to disclose, so the confirmation is unconditional and
 * worded to say nothing either way.
 */
export function RequestPasswordResetForm({
	authClient,
	redirectTo,
	backLink,
}: {
	authClient: AuthClient;
	/** Where the tokenized link in the email should land. */
	redirectTo: string;
	backLink?: React.ReactNode;
}) {
	const [submitted, setSubmitted] = useState(false);

	const form = useAppForm({
		defaultValues: { email: "" },
		onSubmit: async ({ value }) => {
			await authClient.requestPasswordReset({
				email: value.email,
				redirectTo,
			});
			setSubmitted(true);
		},
	});

	if (submitted) {
		return (
			<>
				<AuthHeading
					description="If an account exists with that email, a reset link is on its way. The link expires, so use it soon."
					title="Check your email"
				/>
				<AuthActions>{backLink}</AuthActions>
			</>
		);
	}

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<AuthHeading
				description="Enter the email on your employee record and we'll send a link to set a new password."
				title="Reset your password"
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
			</AuthFieldset>

			<AuthActions aside={backLink}>
				<form.AppForm>
					<form.SubmitFormButton label="Send reset link" />
				</form.AppForm>
			</AuthActions>
		</form>
	);
}

interface ChoosePasswordCopy {
	title: string;
	description: string;
	submitLabel: string;
	/** Shown when the link arrived without a token — names the recovery, not just the problem. */
	missingToken: string;
	/** Shown when the token is present but rejected. */
	invalidToken: string;
	doneTitle: string;
	doneDescription: string;
}

/**
 * Choose a password against a tokenized link.
 *
 * Better Auth's `resetPassword` backs both the reset flow and the invite flow — they are the same
 * call against the same kind of token, and differ only in what the recipient thinks is happening.
 * The copy is therefore a parameter and the flow is not duplicated.
 */
export function ChoosePasswordForm({
	authClient,
	token,
	copy,
	onDone,
	backLink,
}: {
	authClient: AuthClient;
	token: string | undefined;
	copy: ChoosePasswordCopy;
	onDone: () => void;
	backLink?: React.ReactNode;
}) {
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
				setErrorMessage("Those two passwords don't match.");
				return;
			}

			if (!token) {
				setStatus("error");
				setErrorMessage(copy.missingToken);
				return;
			}

			const { error } = await authClient.resetPassword({
				newPassword: value.password,
				token,
			});

			if (error) {
				setStatus("error");
				setErrorMessage(error.message ?? copy.invalidToken);
				return;
			}

			setStatus("success");
			setTimeout(onDone, 2000);
		},
	});

	if (status === "success") {
		return (
			<>
				<AuthHeading
					description={copy.doneDescription}
					title={copy.doneTitle}
				/>
				<AuthActions>{backLink}</AuthActions>
			</>
		);
	}

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<AuthHeading description={copy.description} title={copy.title} />

			<AuthFieldset>
				<form.AppField name="password" validators={{ onBlur: PasswordSchema }}>
					{(field) => (
						<field.PasswordField
							autoComplete="new-password"
							label="New password"
						/>
					)}
				</form.AppField>

				<form.AppField
					name="confirmPassword"
					validators={{
						onBlur: z.string().min(1, "Please confirm your password."),
					}}
				>
					{(field) => (
						<field.PasswordField
							autoComplete="new-password"
							label="Confirm password"
						/>
					)}
				</form.AppField>
			</AuthFieldset>

			<AuthStatus>{errorMessage}</AuthStatus>

			<AuthActions aside={backLink}>
				<form.AppForm>
					<form.SubmitFormButton label={copy.submitLabel} />
				</form.AppForm>
			</AuthActions>
		</form>
	);
}
