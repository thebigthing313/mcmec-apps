/**
 * The Portal Dashboard's Upcoming card (#302 §8): the next five things on the Calendar, each a
 * button opening the same details the Calendar shows.
 *
 * Under `src/apps/` and imported only by the `/` route's component, so it and the four tables it
 * reads stay out of the entry chunk (`pnpm check-bundle`).
 */
import { commissionToday } from "@mcmec/lib/functions/date-fns";
import { Button } from "@mcmec/ui/components/button";
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from "@mcmec/ui/components/card";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@mcmec/ui/components/popover";
import { Skeleton } from "@mcmec/ui/components/skeleton";
import { cn } from "@mcmec/ui/lib/utils";
import { getRouteApi, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { upcomingItems } from "@/src/lib/calendar/filters";
import type { CalendarItem } from "@/src/lib/calendar/items";
import {
	dateTile,
	isOff,
	itemAccessibleName,
	relativeDay,
	whenLabel,
} from "@/src/lib/calendar/labels";
import { useCalendarItems } from "@/src/lib/calendar/use-calendar-items";
import { ItemDetails, SourceDot, StatusBadge } from "../calendar/parts";

const route = getRouteApi("/(app)/");

export function UpcomingCard() {
	const { staffEvents, holidays, meetings, spraySchedules } =
		route.useRouteContext();
	const { items, isReady } = useCalendarItems({
		holidays,
		meetings,
		spraySchedules,
		staffEvents,
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<h2>Upcoming</h2>
				</CardTitle>
				<CardAction>
					<Button asChild size="sm" variant="ghost">
						<Link to="/calendar">
							Open Calendar <ArrowRight />
						</Link>
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent>
				<UpcomingList
					isReady={isReady}
					items={items}
					today={commissionToday()}
				/>
			</CardContent>
		</Card>
	);
}

/**
 * The card's body: the next five of `items` (in Calendar order) as of `today`. Says nothing about
 * emptiness until `isReady`, so a table still syncing never reads as "Nothing scheduled."
 */
export function UpcomingList({
	items,
	today,
	isReady,
}: {
	items: CalendarItem[];
	today: string;
	isReady: boolean;
}) {
	if (!isReady) {
		return (
			<div aria-busy="true" className="space-y-2">
				<output className="sr-only">Loading upcoming items…</output>
				{[0, 1, 2].map((row) => (
					<Skeleton className="h-12 w-full" key={row} />
				))}
			</div>
		);
	}

	const upcoming = upcomingItems(items, today, 5);
	if (upcoming.length === 0) {
		return <p className="text-muted-foreground text-sm">Nothing scheduled.</p>;
	}

	return (
		<ol className="divide-y">
			{upcoming.map((item) => (
				<UpcomingRow item={item} key={item.key} today={today} />
			))}
		</ol>
	);
}

function UpcomingRow({ item, today }: { item: CalendarItem; today: string }) {
	// An item already under way is listed as today's, so a three-day course on its second day
	// reads "Today", not the day it began.
	const day = item.startsOn < today ? today : item.startsOn;
	const tile = dateTile(day);
	const off = isOff(item);

	return (
		<li>
			<Popover>
				<PopoverTrigger asChild>
					<button
						aria-label={itemAccessibleName(item)}
						className={cn(
							"flex w-full items-center gap-3 rounded-md px-1 py-2 text-left hover:bg-secondary focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring",
							off && "text-muted-foreground",
						)}
						type="button"
					>
						<span className="w-12 shrink-0 rounded-md border text-center leading-tight">
							<span className="block text-muted-foreground text-xs uppercase">
								{tile.month}
							</span>
							<span className="block font-semibold">{tile.day}</span>
						</span>
						<SourceDot source={item.source} />
						<span className="min-w-0 flex-1">
							<span
								className={cn(
									"block truncate text-sm",
									off ? "line-through" : "font-medium",
								)}
							>
								{item.title}
							</span>
							<span className="block text-muted-foreground text-xs">
								{`${relativeDay(day, today)} · ${whenLabel(item)}`}
							</span>
						</span>
						<StatusBadge item={item} />
					</button>
				</PopoverTrigger>
				<PopoverContent align="start" className="w-80">
					<ItemDetails item={item} />
				</PopoverContent>
			</Popover>
		</li>
	);
}
