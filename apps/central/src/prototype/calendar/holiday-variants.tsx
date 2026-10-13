/**
 * PROTOTYPE — throwaway (#299). Three Holiday Schedule pages, by `?variant=`; the year is
 * `?year=` in every one.
 *
 *  A — Table. Name / Observed / Falls on, a ‹ year › stepper, past rows muted, the next one
 *      marked.
 *  B — Year at a glance. Twelve mini-months with Holidays filled in, the list beneath.
 *  C — By month. A list grouped under month headings, a big day number per row, and a year
 *      select that names which years have Holidays entered.
 */
import { Badge } from "@mcmec/ui/components/badge";
import { Button } from "@mcmec/ui/components/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@mcmec/ui/components/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@mcmec/ui/components/table";
import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import {
	type CalendarItem,
	fmt,
	fmtShort,
	holidays,
	monthWeeks,
	parse,
	todayIso,
} from "./data";

export type HolidayProps = { year: number; setYear: (y: number) => void };

function forYear(year: number): CalendarItem[] {
	return holidays
		.filter((h) => h.startsOn.startsWith(`${year}-`))
		.sort((a, b) => (a.startsOn < b.startsOn ? -1 : 1));
}

const yearsWithHolidays = () =>
	[...new Set(holidays.map((h) => Number(h.startsOn.slice(0, 4))))].sort();

function YearStepper({ year, setYear }: HolidayProps) {
	return (
		<div className="flex items-center gap-1">
			<Button
				aria-label="Previous year"
				onClick={() => setYear(year - 1)}
				size="icon"
				variant="outline"
			>
				<ChevronLeft />
			</Button>
			<span className="w-16 text-center font-semibold text-lg tabular-nums">
				{year}
			</span>
			<Button
				aria-label="Next year"
				onClick={() => setYear(year + 1)}
				size="icon"
				variant="outline"
			>
				<ChevronRight />
			</Button>
		</div>
	);
}

function EmptyYear({ year }: { year: number }) {
	return (
		<div className="rounded-lg border border-dashed py-12 text-center">
			<Flag className="mx-auto mb-2 size-6 text-muted-foreground" />
			<p className="font-medium">No Holidays entered for {year} yet</p>
			<p className="mt-1 text-muted-foreground text-sm">
				HR adds a year's Holidays once the Commission adopts them.
			</p>
		</div>
	);
}

const fallsNote = (h: CalendarItem) =>
	h.fallsOn ? `Falls on ${fmtShort(h.fallsOn)}` : "";

export function HolidaysA({ year, setYear }: HolidayProps) {
	const today = todayIso();
	const list = forYear(year);
	const next = list.find((h) => h.startsOn >= today);
	return (
		<div className="max-w-3xl space-y-4">
			<YearStepper setYear={setYear} year={year} />
			{list.length === 0 ? (
				<EmptyYear year={year} />
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Holiday</TableHead>
							<TableHead>Observed (offices closed)</TableHead>
							<TableHead>Falls on</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{list.map((h) => (
							<TableRow
								className={h.startsOn < today ? "text-muted-foreground" : ""}
								key={h.key}
							>
								<TableCell className="font-medium">
									{h.title}{" "}
									{h === next ? <Badge className="ml-1">Next</Badge> : null}
								</TableCell>
								<TableCell className="tabular-nums">
									{fmt(h.startsOn, {
										day: "numeric",
										month: "long",
										weekday: "long",
									})}
								</TableCell>
								<TableCell className="text-muted-foreground">
									{h.fallsOn
										? fmt(h.fallsOn, {
												day: "numeric",
												month: "long",
												weekday: "long",
											})
										: "—"}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
			<p className="text-muted-foreground text-xs">
				{list.length} Holidays in {year}
			</p>
		</div>
	);
}

export function HolidaysB({ year, setYear }: HolidayProps) {
	const today = todayIso();
	const list = forYear(year);
	const set = new Map(list.map((h) => [h.startsOn, h]));
	return (
		<div className="space-y-6">
			<YearStepper setYear={setYear} year={year} />
			{list.length === 0 ? <EmptyYear year={year} /> : null}
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
				{Array.from({ length: 12 }, (_, m) => {
					const month = `${year}-${`${m + 1}`.padStart(2, "0")}`;
					return (
						<div key={month}>
							<p className="mb-1 font-medium text-sm">
								{fmt(`${month}-01`, { month: "long" })}
							</p>
							<div className="grid grid-cols-7 gap-px text-center text-[10px]">
								{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
									<span className="text-muted-foreground" key={d}>
										{d[0]}
									</span>
								))}
								{monthWeeks(month)
									.flat()
									.map((day) => {
										const h = set.get(day);
										const inMonth = day.slice(0, 7) === month;
										return (
											<span
												className={`rounded-sm py-0.5 ${!inMonth ? "invisible" : h ? "bg-chart-4 font-semibold text-white" : day === today ? "ring-1 ring-primary" : ""}`}
												key={day}
												title={h?.title}
											>
												{parse(day).getDate()}
											</span>
										);
									})}
							</div>
						</div>
					);
				})}
			</div>
			{list.length > 0 ? (
				<ul className="columns-1 gap-8 text-sm sm:columns-2">
					{list.map((h) => (
						<li
							className={`mb-1 break-inside-avoid ${h.startsOn < today ? "text-muted-foreground" : ""}`}
							key={h.key}
						>
							<span className="inline-block w-24 tabular-nums">
								{fmtShort(h.startsOn)}
							</span>
							{h.title}
							{h.fallsOn ? (
								<span className="text-muted-foreground"> ({fallsNote(h)})</span>
							) : null}
						</li>
					))}
				</ul>
			) : null}
		</div>
	);
}

export function HolidaysC({ year, setYear }: HolidayProps) {
	const today = todayIso();
	const list = forYear(year);
	const years = [
		...new Set([...yearsWithHolidays(), year, Number(today.slice(0, 4)) + 1]),
	].sort();
	const months = new Map<string, CalendarItem[]>();
	for (const h of list) {
		const m = h.startsOn.slice(0, 7);
		months.set(m, [...(months.get(m) ?? []), h]);
	}
	return (
		<div className="max-w-2xl space-y-6">
			<Select onValueChange={(v) => setYear(Number(v))} value={`${year}`}>
				<SelectTrigger aria-label="Year" className="w-48">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{years.map((y) => (
						<SelectItem key={y} value={`${y}`}>
							{y}
							{forYear(y).length === 0
								? " — not entered yet"
								: ` — ${forYear(y).length} Holidays`}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{list.length === 0 ? <EmptyYear year={year} /> : null}
			{[...months].map(([m, hs]) => (
				<section key={m}>
					<h2 className="mb-2 border-b pb-1 font-semibold text-muted-foreground text-sm uppercase tracking-wide">
						{fmt(`${m}-01`, { month: "long" })}
					</h2>
					<ul className="space-y-2">
						{hs.map((h) => (
							<li
								className={`flex items-center gap-4 ${h.startsOn < today ? "opacity-50" : ""}`}
								key={h.key}
							>
								<div className="w-12 text-center">
									<p className="font-semibold text-2xl leading-none">
										{parse(h.startsOn).getDate()}
									</p>
									<p className="text-muted-foreground text-xs">
										{fmt(h.startsOn, { weekday: "short" })}
									</p>
								</div>
								<div>
									<p className="font-medium">{h.title}</p>
									{h.fallsOn ? (
										<p className="text-muted-foreground text-sm">
											{fallsNote(h)}; observed{" "}
											{fmt(h.startsOn, { weekday: "long" })}
										</p>
									) : null}
								</div>
							</li>
						))}
					</ul>
				</section>
			))}
		</div>
	);
}

export const HOLIDAY_VARIANTS = [
	{ Component: HolidaysA, key: "A", name: "Table" },
	{ Component: HolidaysB, key: "B", name: "Year at a glance" },
	{ Component: HolidaysC, key: "C", name: "By month" },
];
