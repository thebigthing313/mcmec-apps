import { signIn } from "@mcmec/auth/signIn";
import { Button } from "@mcmec/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@mcmec/ui/components/card";
import { Input } from "@mcmec/ui/components/input";
import { Label } from "@mcmec/ui/components/label";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
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
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError(null);
		setSubmitting(true);
		try {
			await signIn({ client: authClient, email, password });
			// Cookie is set; the (app) guard re-verifies claims on the next load.
			if (redirect) {
				window.location.href = redirect;
			} else {
				navigate({ to: "/" });
			}
		} catch {
			setError("Invalid email or password.");
			setSubmitting(false);
		}
	};

	return (
		<main className="flex min-h-svh items-center justify-center p-4">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle className="text-xl">HR sign in</CardTitle>
					<CardDescription>Sign in to manage employees.</CardDescription>
				</CardHeader>
				<CardContent>
					<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
						<div className="flex flex-col gap-2">
							<Label htmlFor="email">Email</Label>
							<Input
								autoComplete="username"
								id="email"
								onChange={(e) => setEmail(e.target.value)}
								required
								type="email"
								value={email}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="password">Password</Label>
							<Input
								autoComplete="current-password"
								id="password"
								onChange={(e) => setPassword(e.target.value)}
								required
								type="password"
								value={password}
							/>
						</div>
						{error ? (
							<p className="text-destructive text-sm" role="alert">
								{error}
							</p>
						) : null}
						<Button className="w-full" disabled={submitting} type="submit">
							{submitting ? "Signing in…" : "Sign in"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</main>
	);
}
