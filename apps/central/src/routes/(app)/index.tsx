import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { useLayoutContext } from "@mcmec/ui/mcmec-layout/layout-context";
import { createFileRoute } from "@tanstack/react-router";
// PROTOTYPE — throwaway (#299): Upcoming Items variants, by `?variant=`.
import { PrototypeSwitcher } from "@/src/components/prototype-switcher";
import { UPCOMING_VARIANTS } from "@/src/prototype/calendar/upcoming-variants";

export const Route = createFileRoute("/(app)/")({
	component: Index,
	loader: () => ({ crumb: "Dashboard" }),
	validateSearch: (raw: Record<string, unknown>): { variant?: string } => ({
		variant: typeof raw.variant === "string" ? raw.variant : undefined,
	}),
});

function Index() {
	// The switcher opens a menu only when there is another App to go to (#237), so only then is
	// it worth pointing at.
	const { apps } = useLayoutContext();
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const variant =
		UPCOMING_VARIANTS.find((v) => v.key === search.variant) ??
		(UPCOMING_VARIANTS[0] as (typeof UPCOMING_VARIANTS)[number]);
	const { Component } = variant;
	return (
		<>
			<PageHeader
				description={
					apps.length > 1
						? "Your Apps are in the switcher at the top of the sidebar."
						: "Public Meetings and Public Notices are in the sidebar."
				}
				title="Self Service Portal"
			/>
			<Component />
			<PrototypeSwitcher
				current={variant.key}
				onChange={(key) =>
					navigate({ replace: true, search: { variant: key } })
				}
				variants={UPCOMING_VARIANTS}
			/>
		</>
	);
}
