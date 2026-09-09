import { CENTRAL_FORGOT_PASSWORD_URL } from "@mcmec/lib/constants/apps";
import { safeRedirect } from "@mcmec/lib/functions/safe-redirect";
import { AuthShell, authLinkClassName } from "@mcmec/ui/blocks/auth-shell";
import { SignInForm } from "@mcmec/ui/blocks/sign-in-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { authClient } from "@/src/lib/queryClient";

type LoginSearch = { redirect?: string };

export const Route = createFileRoute("/login")({
	validateSearch: (search: Record<string, unknown>): LoginSearch => ({
		redirect: safeRedirect(search.redirect),
	}),
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const { redirect } = Route.useSearch();

	return (
		<AuthShell destination="Website Management">
			<SignInForm
				authClient={authClient}
				forgotPassword={
					// Recovery lives in Central; see CENTRAL_FORGOT_PASSWORD_URL.
					<a className={authLinkClassName} href={CENTRAL_FORGOT_PASSWORD_URL}>
						Forgot password?
					</a>
				}
				onSignedIn={() => {
					// Cookie is set; the (app) guard re-verifies claims on the next load.
					if (redirect) {
						window.location.href = redirect;
					} else {
						navigate({ to: "/" });
					}
				}}
			/>
		</AuthShell>
	);
}
