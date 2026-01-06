import { signIn } from "@mcmec/supabase/auth/signIn";
import { LoginForm } from "@mcmec/ui/blocks/login-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
	component: RouteComponent,
});

function RouteComponent() {
	const { supabase } = Route.useRouteContext();
	const navigate = useNavigate();

	async function handleSubmit(email: string, password: string) {
		try {
			await signIn({ client: supabase, email, password });
			// Redirect or show success message as needed
			navigate({ to: "/" });
		} catch (error) {
			// Handle sign-in error (e.g., show error message)
			console.error("Sign-in error:", error);
		}
	}

	return (
		<LoginForm onSignIn={(email, password) => handleSubmit(email, password)} />
	);
}
