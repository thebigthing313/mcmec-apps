/**
 * PROTOTYPE — throwaway (#299). Three "Upcoming Items" for the Portal Dashboard, by `?variant=`.
 *
 *  A — Next 5. A flat list of the next five items, no horizon beyond 60 days; cancelled shown,
 *      greyed.
 *  B — Two weeks. Everything in the next 14 days grouped by day, capped at 5 rows; cancelled
 *      hidden; a Holiday reads "Offices closed".
 *  C — Next Holiday + next 4. The next Holiday gets its own callout; the list beside it is the
 *      next four other items, cancelled included with a badge.
 */
import { Button } from "@mcmec/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@mcmec/ui/components/card";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Flag } from "lucide-react";
import {
	addDays,
	type CalendarItem,
	daysBetween,
	fmt,
	fmtLong,
	fmtShort,
	holidays,
	itemsBetween,
	parse,
	SOURCE_LABEL,
	todayIso,
	whenLabel,
} from "./data";
import { isOff, SOURCE_ICON, SOURCE_TONE, StatusBadge } from "./parts";

function CalendarLink() {
	return (
		<Button asChild size="sm" variant="ghost">
			<Link to="/calendar">
				Open Calendar <ArrowRight />
			</Link>
		</Button>
	);
}

/** Upcoming = has not ended yet, so a multi-day item already under way still shows. */
function upcoming(days: number): CalendarItem[] {
	const today = todayIso();
	return itemsBetween(today, addDays(today, days)).filter(
		(i) => i.status !== "completed",
	);
}

function relative(day: string): string {
	const n = daysBetween(todayIso(), day);
	if (n <= 0) return "Today";
	if (n === 1) return "Tomorrow";
	if (n < 7) return fmt(day, { weekday: "long" });
	return fmtShort(day);
}

export function UpcomingA() {
	const items = upcoming(60).slice(0, 5);
	return (
		<Card className="max-w-xl">
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>Upcoming</CardTitle>
				<CalendarLink />
			</CardHeader>
			<CardContent>
				<ul className="divide-y">
					{items.map((it) => {
						const day = it.startsOn < todayIso() ? todayIso() : it.startsOn;
						return (
							<li
								className={`flex items-center gap-3 py-2 ${isOff(it) ? "text-muted-foreground" : ""}`}
								key={it.key}
							>
								<div className="w-12 shrink-0 rounded-md border text-center leading-tight">
									<p className="text-[10px] text-muted-foreground uppercase">
										{fmt(day, { month: "short" })}
									</p>
									<p className="font-semibold">{parse(day).getDate()}</p>
								</div>
								<span
									className={`size-2 shrink-0 rounded-full ${SOURCE_TONE[it.source].dot}`}
								/>
								<div className="min-w-0 flex-1">
									<p
										className={`truncate text-sm ${isOff(it) ? "line-through" : "font-medium"}`}
									>
										{it.title}
									</p>
									<p className="text-muted-foreground text-xs">
										{relative(day)} · {whenLabel(it)}
									</p>
								</div>
								<StatusBadge item={it} />
							</li>
						);
					})}
				</ul>
			</CardContent>
		</Card>
	);
}

export function UpcomingB() {
	const today = todayIso();
	const all = upcoming(14).filter((i) => i.status !== "cancelled");
	const shown = all.slice(0, 5);
	const byDay = new Map<string, CalendarItem[]>();
	for (const it of shown) {
		const day = it.startsOn < today ? today : it.startsOn;
		byDay.set(day, [...(byDay.get(day) ?? []), it]);
	}
	return (
		<section className="max-w-xl space-y-3">
			<div className="flex items-center justify-between">
				<h2 className="font-semibold">Next two weeks</h2>
				<CalendarLink />
			</div>
			{[...byDay].map(([day, list]) => (
				<div key={day}>
					<p className="mb-1 font-medium text-muted-foreground text-xs uppercase">
						{relative(day)}
						{relative(day) !== fmtShort(day) ? ` · ${fmtShort(day)}` : ""}
					</p>
					<ul className="space-y-1">
						{list.map((it) => {
							const Icon = SOURCE_ICON[it.source];
							return (
								<li
									className={`flex items-center gap-3 rounded-md border-l-4 bg-card px-3 py-2 shadow-xs ${SOURCE_TONE[it.source].border}`}
									key={it.key}
								>
									<Icon className="size-4 shrink-0 text-muted-foreground" />
									<span className="min-w-0 flex-1 truncate text-sm">
										{it.title}
									</span>
									<span className="shrink-0 text-muted-foreground text-xs">
										{it.source === "holiday" ? "Offices closed" : whenLabel(it)}
									</span>
								</li>
							);
						})}
					</ul>
				</div>
			))}
			{all.length > shown.length ? (
				<p className="text-muted-foreground text-xs">
					and {all.length - shown.length} more in the next two weeks
				</p>
			) : null}
		</section>
	);
}

export function UpcomingC() {
	const today = todayIso();
	const nextHoliday = holidays.find((h) => h.startsOn >= today);
	const rest = upcoming(60)
		.filter((i) => i.source !== "holiday")
		.slice(0, 4);
	return (
		<div className="grid max-w-3xl gap-4 sm:grid-cols-[14rem_1fr]">
			{nextHoliday ? (
				<Card className="bg-chart-4/10">
					<CardHeader>
						<CardDescription className="flex items-center gap-1.5">
							<Flag className="size-3.5" /> Next Holiday
						</CardDescription>
						<CardTitle className="text-lg">{nextHoliday.title}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-1 text-sm">
						<p>{fmtLong(nextHoliday.startsOn)}</p>
						<p className="text-muted-foreground">
							in {daysBetween(today, nextHoliday.startsOn)} days · offices
							closed
						</p>
						<Link
							className="text-primary text-sm hover:underline"
							to="/holidays"
						>
							Holiday Schedule
						</Link>
					</CardContent>
				</Card>
			) : null}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>Coming up</CardTitle>
					<CalendarLink />
				</CardHeader>
				<CardContent>
					<ul className="space-y-3">
						{rest.map((it) => {
							const day = it.startsOn < today ? today : it.startsOn;
							return (
								<li className="flex items-start gap-3" key={it.key}>
									<span
										className={`mt-0.5 rounded px-1.5 py-0.5 font-medium text-[10px] uppercase ${SOURCE_TONE[it.source].soft}`}
									>
										{SOURCE_LABEL[it.source]}
									</span>
									<div className="min-w-0 flex-1">
										<p
											className={`truncate text-sm ${isOff(it) ? "text-muted-foreground line-through" : ""}`}
										>
											{it.title}
										</p>
										<p className="text-muted-foreground text-xs">
											{relative(day)} · {whenLabel(it)}
										</p>
									</div>
									<StatusBadge item={it} />
								</li>
							);
						})}
					</ul>
				</CardContent>
			</Card>
		</div>
	);
}

export const UPCOMING_VARIANTS = [
	{ Component: UpcomingA, key: "A", name: "Next 5" },
	{ Component: UpcomingB, key: "B", name: "Next two weeks" },
	{ Component: UpcomingC, key: "C", name: "Next Holiday + next 4" },
];
