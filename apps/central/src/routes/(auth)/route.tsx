import { COMPANY_INFO } from "@mcmec/lib/constants/company";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)")({
	component: RouteComponent,
});

function RouteComponent() {
	const { name, address } = COMPANY_INFO;
	return (
		<div className="flex h-screen w-screen items-center justify-center">
			<div className="flex w-full max-w-sm flex-col items-center">
				<Outlet />
				<div className="flex flex-col items-center text-muted-foreground text-xs tracking-tight">
					<span>{name}</span>
					<span>{address}</span>
				</div>
			</div>
		</div>
	);
}
