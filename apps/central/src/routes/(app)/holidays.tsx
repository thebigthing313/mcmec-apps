// PROTOTYPE — throwaway (#299). Fixture data only; see src/prototype/calendar.
import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { createFileRoute } from "@tanstack/react-router";
import { PrototypeSwitcher } from "@/src/components/prototype-switcher";
import { HOLIDAY_VARIANTS } from "@/src/prototype/calendar/holiday-variants";

type HolidaySearch = { variant?: string; year?: number };

export const Route = createFileRoute("/(app)/holidays")({
	component: RouteComponent,
	loader: () => ({ crumb: "Holiday Schedule" }),
	validateSearch: (raw: Record<string, unknown>): HolidaySearch => {
		const year = Number(raw.year);
		return {
			variant: typeof raw.variant === "string" ? raw.variant : undefined,
			year: Number.isInteger(year) && year > 1900 ? year : undefined,
		};
	},
});

function RouteComponent() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const set = (next: Partial<HolidaySearch>) =>
		navigate({ replace: true, search: (prev) => ({ ...prev, ...next }) });
	const variant =
		HOLIDAY_VARIANTS.find((v) => v.key === search.variant) ??
		(HOLIDAY_VARIANTS[0] as (typeof HOLIDAY_VARIANTS)[number]);
	const { Component } = variant;
	return (
		<>
			<PageHeader
				description="The days the Commission observes, with its offices closed."
				title="Holiday Schedule"
			/>
			<Component
				setYear={(year) => set({ year })}
				year={search.year ?? new Date().getFullYear()}
			/>
			<PrototypeSwitcher
				current={variant.key}
				onChange={(key) => set({ variant: key })}
				variants={HOLIDAY_VARIANTS}
			/>
		</>
	);
}
