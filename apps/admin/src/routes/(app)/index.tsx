import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/")({
	component: () => {
		return (
			<div>
				<h1 className="font-bold text-2xl">Admin Dashboard</h1>
				<p className="mt-2 text-muted-foreground">
					Manage user permissions and access control.
				</p>
			</div>
		);
	},
});
