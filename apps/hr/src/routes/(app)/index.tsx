import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/")({
	loader: () => ({ crumb: "Dashboard" }),
	component: () => {
		return (
			<PageHeader
				description="Employee records and their access to the staff applications."
				title="Dashboard"
			/>
		);
	},
});
