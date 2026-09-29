import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { useLayoutContext } from "@mcmec/ui/mcmec-layout/layout-context";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/")({
	component: Index,
	loader: () => ({ crumb: "Dashboard" }),
});

function Index() {
	// The switcher opens a menu only when there is another App to go to (#237), so only then is
	// it worth pointing at.
	const { apps } = useLayoutContext();
	return (
		<PageHeader
			description={
				apps.length > 1
					? "Your Apps are in the switcher at the top of the sidebar."
					: "The Commission's public meetings and notices are in the sidebar."
			}
			title="Self Service Portal"
		/>
	);
}
