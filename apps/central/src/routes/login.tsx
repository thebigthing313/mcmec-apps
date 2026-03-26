import { signIn } from "@mcmec/auth/signIn";
import { LoginForm } from "@mcmec/ui/blocks/login-form";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

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
		<div className="flex min-h-svh w-full flex-col items-center justify-center gap-4 p-6 md:p-10">
			<LoginForm
				onSignIn={(email, password) => handleSubmit(email, password)}
			/>
			<Link
				className="text-blue-600 text-sm underline hover:text-blue-800"
				to="/forgot-password"
			>
				Forgot password?
			</Link>
		</div>
	);
}
