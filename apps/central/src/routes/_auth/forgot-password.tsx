import { authLinkClassName } from "@mcmec/ui/blocks/auth-shell";
import { RequestPasswordResetForm } from "@mcmec/ui/blocks/password-forms";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/forgot-password")({
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	const { authClient } = Route.useRouteContext();

	return (
		<RequestPasswordResetForm
			authClient={authClient}
			backLink={
				<Link className={authLinkClassName} to="/login">
					Back to sign in
				</Link>
			}
			// Better Auth emails a tokenized link that lands back on /reset-password?token=…
			redirectTo={`${window.location.origin}/reset-password`}
		/>
	);
}
