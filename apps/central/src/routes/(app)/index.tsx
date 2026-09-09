import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/")({
	component: Index,
	loader: () => ({ crumb: "Dashboard" }),
});

function Index() {
	return (
		<PageHeader
			description="Your applications are in the switcher at the top of the sidebar."
			title="Central"
		/>
	);
}
