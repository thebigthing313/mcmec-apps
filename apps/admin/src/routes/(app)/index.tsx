import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/")({
	loader: () => ({ crumb: "Dashboard" }),
	component: () => {
		return (
			<PageHeader
				description="Manage user permissions and access control."
				title="Dashboard"
			/>
		);
	},
});
