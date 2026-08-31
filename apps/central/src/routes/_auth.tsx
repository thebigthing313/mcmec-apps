import { AuthShell } from "@mcmec/ui/blocks/auth-shell";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
	component: AuthLayout,
});

function AuthLayout() {
	return (
		<AuthShell destination="Central">
			<Outlet />
		</AuthShell>
	);
}
