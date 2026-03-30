import { building, logo512 } from "@mcmec/lib/constants/assets";
import { COMPANY_INFO } from "@mcmec/lib/constants/company";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
	component: AuthLayout,
});

function AuthLayout() {
	return (
		<div className="grid min-h-svh lg:grid-cols-2">
			<div className="flex flex-col items-center justify-center gap-6 p-6 md:p-10">
				<div className="flex items-center gap-3">
					<img alt={COMPANY_INFO.shortName} className="h-10" src={logo512} />
					<div>
						<h1 className="font-bold text-lg">{COMPANY_INFO.shortName}</h1>
						<p className="text-muted-foreground text-xs">Employee Portal</p>
					</div>
				</div>
				<div className="w-full max-w-sm">
					<Outlet />
				</div>
			</div>
			<div className="relative hidden bg-muted lg:block">
				<img
					alt="MCMEC Building"
					className="absolute inset-0 h-full w-full object-cover"
					src={building}
				/>
			</div>
		</div>
	);
}
