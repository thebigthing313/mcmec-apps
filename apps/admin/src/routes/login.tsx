import { signIn } from "@mcmec/auth/signIn";
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
			navigate({ to: "/" });
		} catch (error) {
			console.error("Sign-in error:", error);
		}
	}

	return (
		<LoginForm onSignIn={(email, password) => handleSubmit(email, password)} />
	);
}
