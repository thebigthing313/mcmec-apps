import { commissionToday } from "@mcmec/lib/functions/date-fns";
import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { Button } from "@mcmec/ui/components/button";
import { Skeleton } from "@mcmec/ui/components/skeleton";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@mcmec/ui/components/toggle-group";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { CalendarDays, ChevronLeft, ChevronRight, List } from "lucide-react";
import { shiftMonth } from "@/src/lib/calendar/days";
import { monthLabel } from "@/src/lib/calendar/labels";
import {
	type CalendarView,
	calendarSearch,
	isCalendarView,
} from "@/src/lib/calendar/search";
import { useCalendarItems } from "@/src/lib/calendar/use-calendar-items";
import { Agenda } from "./agenda";
import { MonthGrid } from "./month-grid";
import { Legend } from "./parts";

const route = getRouteApi("/(app)/calendar");

/**
 * `/calendar`: Staff Events, Holidays, Meetings and Spray Missions on one Calendar, as a month
 * grid or an agenda.
 *
 * The month and the view live only in the URL (`?month=`, `?view=`), so a link opens what its
 * sender saw. "Today" is read once per render, not on a timer: a page left open over midnight
 * keeps yesterday until it is next navigated.
 */
export function CalendarPage() {
	const collections = route.useRouteContext();
	const search = route.useSearch();
	const navigate = useNavigate();
	const today = commissionToday();
	const thisMonth = today.slice(0, 7);
	const month = search.month ?? thisMonth;
	const view: CalendarView = search.view ?? "month";
	const { items, isReady } = useCalendarItems({
		holidays: collections.holidays,
		meetings: collections.meetings,
		spraySchedules: collections.spraySchedules,
		staffEvents: collections.staffEvents,
	});

	const previous = shiftMonth(month, -1);
	const next = shiftMonth(month, 1);

	return (
		<>
			<PageHeader
				description="Staff Events, Holidays, Meetings and Spray Missions in one place."
				title="Calendar"
			/>
			<div className="space-y-4">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-1">
						<Button asChild size="icon" variant="outline">
							<Link
								aria-label={`Previous month, ${monthLabel(previous)}`}
								search={calendarSearch(previous, view, thisMonth)}
								to="/calendar"
							>
								<ChevronLeft />
							</Link>
						</Button>
						<Button asChild size="icon" variant="outline">
							<Link
								aria-label={`Next month, ${monthLabel(next)}`}
								search={calendarSearch(next, view, thisMonth)}
								to="/calendar"
							>
								<ChevronRight />
							</Link>
						</Button>
						<Button asChild variant="outline">
							<Link
								search={calendarSearch(thisMonth, view, thisMonth)}
								to="/calendar"
							>
								Today
							</Link>
						</Button>
						<h2 aria-live="polite" className="ml-2 font-semibold text-lg">
							{monthLabel(month)}
						</h2>
					</div>
					<ToggleGroup
						aria-label="View"
						onValueChange={(value) => {
							if (isCalendarView(value)) {
								navigate({
									search: calendarSearch(month, value, thisMonth),
									to: "/calendar",
								});
							}
						}}
						type="single"
						value={view}
						variant="outline"
					>
						<ToggleGroupItem value="month">
							<CalendarDays /> Month
						</ToggleGroupItem>
						<ToggleGroupItem value="agenda">
							<List /> Agenda
						</ToggleGroupItem>
					</ToggleGroup>
				</div>
				<Legend />
				{!isReady ? (
					<Skeleton className="h-96 w-full rounded-lg" />
				) : view === "month" ? (
					<MonthGrid items={items} month={month} today={today} />
				) : (
					<Agenda items={items} month={month} today={today} />
				)}
			</div>
		</>
	);
}
