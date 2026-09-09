import { authLinkClassName } from "@mcmec/ui/blocks/auth-shell";
import { ChoosePasswordForm } from "@mcmec/ui/blocks/password-forms";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import z from "zod";

export const Route = createFileRoute("/_auth/reset-password")({
	component: ResetPasswordPage,
	// Better Auth redirects here with the reset token in the query string.
	validateSearch: z.object({ token: z.string().optional() }),
});

function ResetPasswordPage() {
	const { authClient } = Route.useRouteContext();
	const { token } = Route.useSearch();
	const navigate = useNavigate();

	return (
		<ChoosePasswordForm
			authClient={authClient}
			backLink={
				<Link className={authLinkClassName} to="/login">
					Back to sign in
				</Link>
			}
			copy={{
				description: "Choose a new password for your Commission account.",
				doneDescription:
					"Your password has been reset. Taking you to sign in...",
				doneTitle: "Password updated",
				invalidToken: "That reset link is invalid or has expired.",
				missingToken:
					"This reset link is missing its token. Request a new one from the sign-in page.",
				submitLabel: "Reset password",
				title: "Set a new password",
			}}
			onDone={() => navigate({ to: "/login" })}
			token={token}
		/>
	);
}
