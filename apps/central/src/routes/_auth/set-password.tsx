import { authLinkClassName } from "@mcmec/ui/blocks/auth-shell";
import { ChoosePasswordForm } from "@mcmec/ui/blocks/password-forms";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import z from "zod";

export const Route = createFileRoute("/_auth/set-password")({
	component: SetPasswordPage,
	// Where an invite lands (the api's AUTH_RESET_URL): same tokenized reset flow as
	// /reset-password, worded for someone setting a password for the first time.
	validateSearch: z.object({ token: z.string().optional() }),
});

function SetPasswordPage() {
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
				description:
					"Choose a password to finish setting up your account. It reaches every Commission application.",
				doneDescription: "Your password has been set. Taking you to sign in...",
				doneTitle: "You're all set",
				invalidToken: "That invite link is invalid or has expired.",
				missingToken:
					"This invite link is missing its token. Ask an administrator to re-send it.",
				submitLabel: "Set password",
				title: "Set your password",
			}}
			onDone={() => navigate({ to: "/login" })}
			token={token}
		/>
	);
}
