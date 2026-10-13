import { cn } from "@mcmec/ui/lib/utils";
import { monthItems } from "@/src/lib/calendar/filters";
import type { CalendarItem } from "@/src/lib/calendar/items";
import {
	dayShort,
	isOff,
	monthLabel,
	whenLabel,
} from "@/src/lib/calendar/labels";
import { ItemPopover } from "./item-popover";
import { SourceDot, StatusBadge } from "./parts";

/**
 * The days of a month that have something on them, in order, each with its items. A multi-day
 * item is listed once: on the day it starts, or on the 1st if it began the month before.
 */
export function agendaDays(
	items: CalendarItem[],
	month: string,
): [day: string, items: CalendarItem[]][] {
	const first = `${month}-01`;
	const byDay = new Map<string, CalendarItem[]>();
	for (const item of monthItems(items, month)) {
		const day = item.startsOn < first ? first : item.startsOn;
		byDay.set(day, [...(byDay.get(day) ?? []), item]);
	}
	return [...byDay].sort(([a], [b]) => (a < b ? -1 : 1));
}

/**
 * The Calendar as a list: the selected month, a day at a time, each item a row with its colour,
 * when, title and status in words.
 */
export function Agenda({
	items,
	month,
	today,
}: {
	/** The Calendar's items, in Calendar order (`sortItems`). */
	items: CalendarItem[];
	/** `YYYY-MM` */
	month: string;
	/** `YYYY-MM-DD` in Edison, marked in the list. */
	today: string;
}) {
	const days = agendaDays(items, month);
	if (days.length === 0) {
		return (
			<p className="rounded-lg border py-12 text-center text-muted-foreground text-sm">
				Nothing on the Calendar in {monthLabel(month)}.
			</p>
		);
	}
	return (
		<ol className="divide-y rounded-lg border">
			{days.map(([day, list]) => (
				<li
					aria-current={day === today ? "date" : undefined}
					className="grid gap-x-4 gap-y-1 p-3 sm:grid-cols-[8rem_1fr]"
					key={day}
				>
					<h3
						className={cn(
							"pt-1 font-medium text-sm tabular-nums",
							day === today && "text-primary",
						)}
					>
						{dayShort(day)}
						{day === today ? (
							<span className="ml-1.5 font-normal text-xs">Today</span>
						) : null}
					</h3>
					<ul className="space-y-1">
						{list.map((item) => (
							<li key={item.key}>
								<AgendaRow item={item} />
							</li>
						))}
					</ul>
				</li>
			))}
		</ol>
	);
}

function AgendaRow({ item }: { item: CalendarItem }) {
	const off = isOff(item);
	return (
		<>
			<ItemPopover
				className={cn(
					"flex w-full items-center gap-2 rounded-md border border-transparent px-2 py-1 text-sm hover:bg-secondary",
					item.status === "rainDate" && "border-current border-dashed",
				)}
				item={item}
			>
				<SourceDot source={item.source} />
				<span
					className={cn(
						"w-36 shrink-0 text-muted-foreground tabular-nums",
						off && "line-through",
					)}
				>
					{whenLabel(item)}
				</span>
				<span
					className={cn(
						"min-w-0 flex-1 truncate",
						off && "text-muted-foreground line-through",
					)}
				>
					{item.title}
				</span>
				<StatusBadge item={item} />
			</ItemPopover>
			{/* Outside the button, whose name is the item's whole description, so it is read too. */}
			{item.status === "delayed" && item.otherDate ? (
				<p className="pl-[calc(1.125rem+0.5rem)] text-muted-foreground text-xs">
					Moved to its rain date, {dayShort(item.otherDate)}.
				</p>
			) : null}
		</>
	);
}
