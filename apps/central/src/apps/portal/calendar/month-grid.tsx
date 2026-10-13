import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@mcmec/ui/components/popover";
import { cn } from "@mcmec/ui/lib/utils";
import { monthWeeks } from "@/src/lib/calendar/days";
import { itemsBetween } from "@/src/lib/calendar/filters";
import type { CalendarItem } from "@/src/lib/calendar/items";
import {
	clockLabel,
	dayLong,
	isOff,
	monthLabel,
	statusLabel,
} from "@/src/lib/calendar/labels";
import { packWeek, type WeekSegment } from "@/src/lib/calendar/pack-week";
import { ItemPopover } from "./item-popover";
import { ItemDetails, SOURCE_TONE, SourceDot } from "./parts";

/** Rows of items a week shows before the rest go under "+N more". */
export const LANES = 3;

const WEEKDAYS = [
	["Sun", "Sunday"],
	["Mon", "Monday"],
	["Tue", "Tuesday"],
	["Wed", "Wednesday"],
	["Thu", "Thursday"],
	["Fri", "Friday"],
	["Sat", "Saturday"],
] as const;

/**
 * The Calendar as a month: a table of Sunday-to-Saturday weeks.
 *
 * Whole-day and multi-day items are solid bars in their source's colour, drawn across the days
 * they cover and squared off where they run on from the week before or into the week after.
 * Timed single-day items are a dot, the start time and the title. Each week shows `LANES` rows;
 * a day with more gets a "+N more" popover that lists the whole day.
 *
 * A bar's button sits in the cell of the day it starts on (in that week) and is drawn across its
 * neighbours, so the table stays a table to a screen reader: each item is read once per week,
 * from its first day, with its full dates in its name.
 */
export function MonthGrid({
	items,
	month,
	today,
}: {
	/** The Calendar's items, in Calendar order (`sortItems`); the grid takes the weeks' own. */
	items: CalendarItem[];
	/** `YYYY-MM` */
	month: string;
	/** `YYYY-MM-DD` in Edison, marked in the grid. */
	today: string;
}) {
	const weeks = monthWeeks(month);
	return (
		<div className="overflow-x-auto rounded-lg border">
			<table className="w-full min-w-[42rem] table-fixed border-collapse">
				<caption className="sr-only">{monthLabel(month)}</caption>
				<thead>
					<tr className="bg-muted/50">
						{WEEKDAYS.map(([short, long]) => (
							<th
								className="border-b py-1.5 font-medium text-muted-foreground text-xs"
								key={long}
								scope="col"
							>
								<span aria-hidden="true">{short}</span>
								<span className="sr-only">{long}</span>
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{weeks.map((week) => (
						<Week
							items={items}
							key={week[0]}
							month={month}
							today={today}
							week={week}
						/>
					))}
				</tbody>
			</table>
		</div>
	);
}

function Week({
	week,
	items,
	month,
	today,
}: {
	week: string[];
	items: CalendarItem[];
	month: string;
	today: string;
}) {
	const segments = packWeek(week, items);
	return (
		<tr>
			{week.map((day, col) => {
				const inMonth = day.slice(0, 7) === month;
				const starting = segments.filter(
					(segment) => segment.col === col && segment.lane < LANES,
				);
				const hidden = segments.filter(
					(segment) =>
						segment.lane >= LANES &&
						segment.col <= col &&
						col < segment.col + segment.span,
				).length;
				return (
					<td
						aria-current={day === today ? "date" : undefined}
						className={cn(
							"relative h-[7.75rem] border-r border-b p-0 align-top last:border-r-0",
							!inMonth && "bg-muted/40",
						)}
						key={day}
					>
						<div className="flex h-7 items-center px-1.5">
							<span
								aria-hidden="true"
								className={cn(
									"flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
									day === today &&
										"bg-primary font-semibold text-primary-foreground",
									day !== today && !inMonth && "text-muted-foreground",
								)}
							>
								{Number(day.slice(8, 10))}
							</span>
							<span className="sr-only">
								{dayLong(day)}
								{day === today ? ", today" : ""}
							</span>
						</div>
						{starting.map((segment) => (
							<Bar key={segment.item.key} segment={segment} />
						))}
						{hidden > 0 ? (
							<MoreOnDay count={hidden} day={day} items={items} />
						) : null}
					</td>
				);
			})}
		</tr>
	);
}

/** One item's piece of the week, drawn across `span` cells from the cell it starts in. */
function Bar({ segment }: { segment: WeekSegment }) {
	const { item, lane, span, continuesBefore, continuesAfter } = segment;
	const tone = SOURCE_TONE[item.source];
	// A solid bar for a whole-day or multi-day item; a dot and a time for a timed single day.
	const solid = !item.startTime || item.startsOn !== item.endsOn;
	const status = statusLabel(item.status);
	return (
		<ItemPopover
			className={cn(
				"absolute z-10 flex h-[1.375rem] items-center gap-1 overflow-hidden px-1.5 text-xs leading-none",
				solid ? tone.solid : "rounded hover:bg-secondary",
				solid && (continuesBefore ? "rounded-l-none" : "rounded-l"),
				solid && (continuesAfter ? "rounded-r-none" : "rounded-r"),
				item.status === "rainDate" && "border border-current border-dashed",
			)}
			data-continues-after={continuesAfter || undefined}
			data-continues-before={continuesBefore || undefined}
			data-span={span}
			item={item}
			style={{
				// A cell's width per day spanned, plus the 1px rules between them, inset 2px a side.
				left: continuesBefore ? 0 : "2px",
				top: `calc(1.75rem + ${lane} * 1.5rem)`,
				width: `calc(${span} * 100% + ${span - 1}px - ${
					(continuesBefore ? 0 : 2) + (continuesAfter ? 0 : 2)
				}px)`,
			}}
		>
			{solid ? null : (
				<>
					<SourceDot className="size-2" source={item.source} />
					<span className="text-muted-foreground tabular-nums">
						{clockLabel(item.startTime as string)}
					</span>
				</>
			)}
			{/* The status in words, never struck: the strike says the item is off, the word says why. */}
			{status ? <span className="shrink-0 font-semibold">{status}</span> : null}
			<span className={cn("truncate", isOff(item) && "line-through")}>
				{item.title}
			</span>
		</ItemPopover>
	);
}

/** "+N more": the day's items past the week's lanes — the popover lists the whole day. */
function MoreOnDay({
	day,
	count,
	items,
}: {
	day: string;
	count: number;
	items: CalendarItem[];
}) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					className="absolute right-0.5 bottom-0.5 left-0.5 rounded-sm px-1 text-left text-muted-foreground text-xs hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
					type="button"
				>
					+{count} more
					<span className="sr-only"> on {dayLong(day)}</span>
				</button>
			</PopoverTrigger>
			<PopoverContent className="max-h-[60vh] w-80 overflow-y-auto">
				<p className="mb-3 font-medium text-sm">{dayLong(day)}</p>
				<ul className="divide-y">
					{itemsBetween(items, day, day).map((item) => (
						<li className="py-3 first:pt-0 last:pb-0" key={item.key}>
							<ItemDetails item={item} />
						</li>
					))}
				</ul>
			</PopoverContent>
		</Popover>
	);
}
