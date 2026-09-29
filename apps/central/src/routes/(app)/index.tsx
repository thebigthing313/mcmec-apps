import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/")({
	component: Index,
	loader: () => ({ crumb: "Dashboard" }),
});

function Index() {
	return (
		<PageHeader
			description="Your Apps are in the switcher at the top of the sidebar."
			title="Self Service Portal"
		/>
	);
}
