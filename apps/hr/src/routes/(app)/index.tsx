import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/")({
	component: () => {
		return (
			<div>
				<h1 className="font-bold text-2xl">HR Dashboard</h1>
				<p className="mt-2 text-muted-foreground">
					Welcome to the HR management portal.
				</p>
			</div>
		);
	},
});
