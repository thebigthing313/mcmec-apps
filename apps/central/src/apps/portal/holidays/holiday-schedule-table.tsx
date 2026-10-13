import { Badge } from "@mcmec/ui/components/badge";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@mcmec/ui/components/empty";
import { Skeleton } from "@mcmec/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@mcmec/ui/components/table";
import { cn } from "@mcmec/ui/lib/utils";
import type { CalendarItem } from "@/src/lib/calendar/items";
import { dayLong } from "@/src/lib/calendar/labels";
import { SOURCE_ICON } from "../calendar/parts";

const HolidayIcon = SOURCE_ICON.holiday;

/** Fixed keys so the skeleton rows are not keyed by array index. */
const SKELETON_ROWS = ["a", "b", "c", "d", "e"];

/**
 * One year's Holidays as a table: Holiday | Observed (offices closed) | Falls on.
 *
 * Presentational — the page hands it the year's Holidays in Calendar order, "today" in Edison
 * and the next Holiday's key, so it can be rendered with any day as today.
 *
 * - A Holiday observed before today is past, and muted.
 * - The next Holiday carries a **Next** badge. It is the first observed today or later in any
 *   year, so a later year shows no badge while this year still has a Holiday to come.
 * - The count is the table's caption, so it sits under the table and names it for a screen
 *   reader in one.
 *
 * Loading and empty are different screens: an empty year is never announced over a table still
 * syncing.
 */
export function HolidayScheduleTable({
	holidays,
	year,
	today,
	nextKey,
	isReady,
}: {
	holidays: CalendarItem[];
	year: number;
	today: string;
	/** The key of the first Holiday observed today or later, in any year. */
	nextKey?: string;
	isReady: boolean;
}) {
	if (isReady && holidays.length === 0) {
		return (
			<Empty className="border border-dashed">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<HolidayIcon />
					</EmptyMedia>
					<EmptyTitle>No Holidays entered for {year} yet.</EmptyTitle>
					<EmptyDescription>
						HR adds a year's Holidays once the Commission adopts them.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<div className="overflow-hidden rounded-xl border">
			<Table aria-busy={!isReady}>
				<TableCaption className="mb-3 text-xs">
					{isReady
						? `${holidays.length} ${holidays.length === 1 ? "Holiday" : "Holidays"} in ${year}`
						: `Loading Holidays for ${year}`}
				</TableCaption>
				<TableHeader>
					<TableRow>
						<TableHead>Holiday</TableHead>
						<TableHead>Observed (offices closed)</TableHead>
						<TableHead>Falls on</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{isReady
						? holidays.map((holiday) => (
								<TableRow
									className={cn(
										holiday.startsOn < today && "text-muted-foreground",
									)}
									key={holiday.key}
								>
									<TableCell className="font-medium">
										{holiday.title}
										{holiday.key === nextKey ? (
											<Badge className="ml-2">Next</Badge>
										) : null}
									</TableCell>
									<TableCell className="tabular-nums">
										{dayLong(holiday.startsOn)}
									</TableCell>
									<TableCell className="text-muted-foreground tabular-nums">
										{holiday.fallsOn ? dayLong(holiday.fallsOn) : "—"}
									</TableCell>
								</TableRow>
							))
						: SKELETON_ROWS.map((rowKey) => (
								<TableRow key={rowKey}>
									<TableCell>
										<Skeleton className="h-4 w-full max-w-40" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-full max-w-48" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-full max-w-24" />
									</TableCell>
								</TableRow>
							))}
				</TableBody>
			</Table>
		</div>
	);
}
