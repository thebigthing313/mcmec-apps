// PROTOTYPE — throwaway (#299). Fixture data only; see src/prototype/calendar.
import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { createFileRoute } from "@tanstack/react-router";
import { PrototypeSwitcher } from "@/src/components/prototype-switcher";
import {
	CALENDAR_VARIANTS,
	type View,
} from "@/src/prototype/calendar/calendar-variants";
import { todayIso } from "@/src/prototype/calendar/data";

type CalendarSearch = { variant?: string; month?: string; view?: View };

export const Route = createFileRoute("/(app)/calendar")({
	component: RouteComponent,
	loader: () => ({ crumb: "Calendar" }),
	validateSearch: (raw: Record<string, unknown>): CalendarSearch => ({
		month:
			typeof raw.month === "string" && /^\d{4}-\d{2}$/.test(raw.month)
				? raw.month
				: undefined,
		variant: typeof raw.variant === "string" ? raw.variant : undefined,
		view: raw.view === "month" || raw.view === "agenda" ? raw.view : undefined,
	}),
});

function RouteComponent() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const set = (next: Partial<CalendarSearch>) =>
		navigate({ replace: true, search: (prev) => ({ ...prev, ...next }) });
	const variant =
		CALENDAR_VARIANTS.find((v) => v.key === search.variant) ??
		(CALENDAR_VARIANTS[0] as (typeof CALENDAR_VARIANTS)[number]);
	const { Component } = variant;
	return (
		<>
			<PageHeader
				description="Staff Events, Holidays, Public Meetings and Spray Missions in one place."
				title="Calendar"
			/>
			<Component
				key={variant.key}
				month={search.month ?? todayIso().slice(0, 7)}
				setMonth={(month) => set({ month })}
				setView={(view) => set({ view })}
				view={search.view}
			/>
			<PrototypeSwitcher
				current={variant.key}
				onChange={(key) => set({ variant: key, view: undefined })}
				variants={CALENDAR_VARIANTS}
			/>
		</>
	);
}
