import { authLinkClassName } from "@mcmec/ui/blocks/auth-shell";
import { SignInForm } from "@mcmec/ui/blocks/sign-in-form";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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

	return (
		<SignInForm
			authClient={authClient}
			forgotPassword={
				<Link className={authLinkClassName} to="/forgot-password">
					Forgot password?
				</Link>
			}
			onSignedIn={() => {
				// The session cookie is shared across every MCMEC app, so there's nothing to hand
				// off — the old token-in-the-hash dance for sibling apps is gone.
				if (redirectTo) {
					window.location.href = redirectTo;
				} else {
					navigate({ to: "/" });
				}
			}}
		/>
	);
}
