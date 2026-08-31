import { CENTRAL_FORGOT_PASSWORD_URL } from "@mcmec/lib/constants/apps";
import { AuthShell, authLinkClassName } from "@mcmec/ui/blocks/auth-shell";
import { SignInForm } from "@mcmec/ui/blocks/sign-in-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { authClient } from "@/src/lib/queryClient";

type LoginSearch = { redirect?: string };

/**
 * Only same-origin paths may be redirected to after sign-in. Anything else
 * (absolute URLs, protocol-relative `//evil.example`) is discarded so the
 * search param can't bounce a freshly authenticated user off-site.
 */
function safeRedirect(value: unknown): string | undefined {
	if (typeof value !== "string") return undefined;
	if (!value.startsWith("/") || value.startsWith("//")) return undefined;
	return value;
}

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
		<AuthShell destination="HR">
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
