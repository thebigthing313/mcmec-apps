import { commissionToday, yearOf } from "@mcmec/lib/functions/date-fns";
import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { YearStepper } from "@mcmec/ui/blocks/year-stepper";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { holidaysInYear } from "@/src/lib/calendar/filters";
import { useCalendarItems } from "@/src/lib/calendar/use-calendar-items";
import { HolidayScheduleTable } from "./holiday-schedule-table";

const route = getRouteApi("/(app)/holidays");

/**
 * `/holidays`: the Holidays every Employee has off, a year at a time.
 *
 * The year comes from `?year=`, and an absent one is this year in Edison. "Today" is read once
 * per render, not on a timer: a screen left open overnight keeps yesterday's Next badge until it
 * next renders.
 */
export function HolidaySchedulePage() {
	const { holidays } = route.useRouteContext();
	const search = route.useSearch();
	const navigate = useNavigate();
	const today = commissionToday();
	const year = search.year ?? yearOf(today);

	const { items, isReady } = useCalendarItems({ holidays });
	// Across every year, so the badge marks the Holiday actually coming up next — not the first of
	// a later year while this one still has some to come. Only Holidays were asked for, and the
	// items are in Calendar order.
	const next = items.find((item) => item.startsOn >= today);

	return (
		<div className="max-w-4xl">
			<PageHeader
				actions={
					<YearStepper
						onYearChange={(next) =>
							navigate({ search: { year: next }, to: "/holidays" })
						}
						year={year}
					/>
				}
				description="The days the Commission observes, with its offices closed."
				title="Holiday Schedule"
			/>
			<HolidayScheduleTable
				holidays={holidaysInYear(items, year)}
				isReady={isReady}
				nextKey={next?.key}
				today={today}
				year={year}
			/>
		</div>
	);
}
