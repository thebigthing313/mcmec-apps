import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { useLayoutContext } from "@mcmec/ui/mcmec-layout/layout-context";
import { createFileRoute } from "@tanstack/react-router";
import { UpcomingCard } from "@/src/apps/portal/dashboard/upcoming-card";

export const Route = createFileRoute("/(app)/")({
	// The Upcoming card reads all four Calendar tables, so this route asks for and preloads all
	// four. Only the component imports the card, which keeps it and the tables out of the entry.
	beforeLoad: ({ context }) => {
		// TanStack Router runs every `beforeLoad` in a match even after an earlier one throws, so
		// this runs for a User the signed-in layout has just refused (no linked Employee). Its
		// `claims` are absent then: ask for nothing, on a match that never renders.
		if (!context.claims) throw new Error("Refused by the signed-in layout.");
		return context.collections.use(
			"staffEvents",
			"holidays",
			"meetings",
			"spraySchedules",
		);
	},
	component: Index,
	loader: async ({ context }) => {
		await Promise.all([
			context.staffEvents.preload(),
			context.holidays.preload(),
			context.meetings.preload(),
			context.spraySchedules.preload(),
		]);
		return { crumb: "Dashboard" };
	},
});

function Index() {
	// The switcher opens a menu only when there is another App to go to (#237), so only then is
	// it worth pointing at.
	const { apps } = useLayoutContext();
	return (
		<div className="space-y-6">
			<PageHeader
				description={
					apps.length > 1
						? "Your Apps are in the switcher at the top of the sidebar."
						: "Public Meetings and Public Notices are in the sidebar."
				}
				title="Self Service Portal"
			/>
			<UpcomingCard />
		</div>
	);
}
