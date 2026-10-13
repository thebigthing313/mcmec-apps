/**
 * PROTOTYPE — throwaway (#299). Three Calendar pages, switchable by `?variant=`.
 *
 *  A — Month grid first. Multi-day items are bars spanning cells; colour + legend tell sources
 *      apart; clicking an item opens a popover. Agenda is the other half of a toggle.
 *  B — Agenda first. A day-by-day list where every row says its source in words and an icon;
 *      clicking a row expands it in place. The month view is a compact density map whose days
 *      jump into the agenda.
 *  C — Split. A month grid of per-day chips (no spanning bars) beside a day panel that shows
 *      the selected day in full. No toggle on wide screens; cancelled items hidden by default.
 */
import { Button } from "@mcmec/ui/components/button";
import { Label } from "@mcmec/ui/components/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@mcmec/ui/components/popover";
import { Switch } from "@mcmec/ui/components/switch";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@mcmec/ui/components/toggle-group";
import { CalendarDays, ChevronLeft, ChevronRight, List } from "lucide-react";
import { useEffect, useState } from "react";
import {
	type CalendarItem,
	compareItems,
	fmt,
	fmtLong,
	fmtMonth,
	fmtTime,
	itemsBetween,
	itemsOn,
	monthWeeks,
	packWeek,
	parse,
	SOURCE_LABEL,
	shiftMonth,
	todayIso,
	whenLabel,
} from "./data";
import {
	ItemDetails,
	isOff,
	Legend,
	SOURCE_ICON,
	SOURCE_TONE,
	StatusBadge,
} from "./parts";

export type View = "month" | "agenda";
export type CalendarProps = {
	month: string;
	setMonth: (m: string) => void;
	view: View | undefined;
	setView: (v: View) => void;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function MonthNav({
	month,
	setMonth,
}: Pick<CalendarProps, "month" | "setMonth">) {
	const thisMonth = todayIso().slice(0, 7);
	return (
		<div className="flex items-center gap-1">
			<Button
				aria-label="Previous month"
				onClick={() => setMonth(shiftMonth(month, -1))}
				size="icon"
				variant="outline"
			>
				<ChevronLeft />
			</Button>
			<Button
				aria-label="Next month"
				onClick={() => setMonth(shiftMonth(month, 1))}
				size="icon"
				variant="outline"
			>
				<ChevronRight />
			</Button>
			<Button
				disabled={month === thisMonth}
				onClick={() => setMonth(thisMonth)}
				variant="outline"
			>
				Today
			</Button>
			<h2 className="ml-2 font-semibold text-lg">{fmtMonth(month)}</h2>
		</div>
	);
}

function ViewToggle({
	view,
	setView,
}: {
	view: View;
	setView: (v: View) => void;
}) {
	return (
		<ToggleGroup
			onValueChange={(v) => v && setView(v as View)}
			type="single"
			value={view}
			variant="outline"
		>
			<ToggleGroupItem aria-label="Month" value="month">
				<CalendarDays /> Month
			</ToggleGroupItem>
			<ToggleGroupItem aria-label="Agenda" value="agenda">
				<List /> Agenda
			</ToggleGroupItem>
		</ToggleGroup>
	);
}

// ── A ────────────────────────────────────────────────────────────────────────

const LANES = 3;

export function CalendarA({
	month,
	setMonth,
	view = "month",
	setView,
}: CalendarProps) {
	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<MonthNav month={month} setMonth={setMonth} />
				<ViewToggle setView={setView} view={view} />
			</div>
			<Legend />
			{view === "month" ? <GridA month={month} /> : <AgendaA month={month} />}
		</div>
	);
}

function GridA({ month }: { month: string }) {
	const today = todayIso();
	const weeks = monthWeeks(month);
	const items = itemsBetween(weeks[0]?.[0] ?? "", weeks.at(-1)?.[6] ?? "");
	return (
		<div className="overflow-hidden rounded-lg border">
			<div className="grid grid-cols-7 border-b bg-muted/50 text-center font-medium text-muted-foreground text-xs">
				{WEEKDAYS.map((d) => (
					<div className="py-1.5" key={d}>
						{d}
					</div>
				))}
			</div>
			{weeks.map((week) => {
				const segs = packWeek(week, items);
				return (
					<div
						className="grid grid-cols-7 border-b last:border-b-0"
						key={week[0]}
						style={{
							gridTemplateRows: `1.75rem repeat(${LANES}, 1.5rem) 1.5rem`,
						}}
					>
						{week.map((day, i) => {
							const hidden = segs.filter(
								(s) => s.lane >= LANES && s.col <= i && i < s.col + s.span,
							);
							return (
								<div
									className={`border-r last:border-r-0 ${day.slice(0, 7) !== month ? "bg-muted/40" : ""}`}
									key={day}
									style={{ gridColumn: i + 1, gridRow: "1 / -1" }}
								>
									<div className="flex h-7 items-center px-1.5">
										<span
											className={`flex size-6 items-center justify-center rounded-full text-xs ${day === today ? "bg-primary font-semibold text-primary-foreground" : day.slice(0, 7) !== month ? "text-muted-foreground" : ""}`}
										>
											{parse(day).getDate()}
										</span>
									</div>
									{hidden.length > 0 ? (
										<Popover>
											<PopoverTrigger asChild>
												<button
													className="mt-[4.5rem] w-full px-1.5 text-left text-muted-foreground text-xs hover:text-foreground"
													type="button"
												>
													+{hidden.length} more
												</button>
											</PopoverTrigger>
											<PopoverContent className="w-80 space-y-4">
												<p className="font-medium text-sm">{fmtLong(day)}</p>
												{itemsOn(day).map((it) => (
													<ItemDetails item={it} key={it.key} />
												))}
											</PopoverContent>
										</Popover>
									) : null}
								</div>
							);
						})}
						{segs
							.filter((s) => s.lane < LANES)
							.map((s) => (
								<Popover key={s.item.key}>
									<PopoverTrigger asChild>
										<button
											className="z-10 mx-0.5 my-px min-w-0"
											style={{
												gridColumn: `${s.col + 1} / span ${s.span}`,
												gridRow: s.lane + 2,
											}}
											type="button"
										>
											<BarA
												continuesAfter={s.continuesAfter}
												continuesBefore={s.continuesBefore}
												item={s.item}
											/>
										</button>
									</PopoverTrigger>
									<PopoverContent className="w-80">
										<ItemDetails item={s.item} />
									</PopoverContent>
								</Popover>
							))}
					</div>
				);
			})}
		</div>
	);
}

function BarA({
	item,
	continuesBefore,
	continuesAfter,
}: {
	item: CalendarItem;
	continuesBefore: boolean;
	continuesAfter: boolean;
}) {
	const tone = SOURCE_TONE[item.source];
	const whole = !item.startTime || item.startsOn !== item.endsOn;
	const off = isOff(item);
	const base =
		"flex h-full w-full items-center gap-1 truncate px-1.5 text-left text-xs leading-none";
	const deco = `${off ? "line-through opacity-60" : ""} ${item.status === "rainDate" ? "border border-dashed border-current" : ""}`;
	if (whole) {
		return (
			<span
				className={`${base} ${tone.solid} ${deco} ${continuesBefore ? "rounded-l-none" : "rounded-l"} ${continuesAfter ? "rounded-r-none" : "rounded-r"}`}
			>
				<span className="truncate">{item.title}</span>
			</span>
		);
	}
	return (
		<span className={`${base} rounded hover:bg-muted ${deco}`}>
			<span className={`size-2 shrink-0 rounded-full ${tone.dot}`} />
			<span className="text-muted-foreground tabular-nums">
				{fmtTime(item.startTime as string)}
			</span>
			<span className="truncate">{item.title}</span>
		</span>
	);
}

function AgendaA({ month }: { month: string }) {
	const items = itemsBetween(`${month}-01`, `${month}-31`);
	const byDay = new Map<string, CalendarItem[]>();
	for (const it of items) {
		const day = it.startsOn < `${month}-01` ? `${month}-01` : it.startsOn;
		byDay.set(day, [...(byDay.get(day) ?? []), it]);
	}
	if (byDay.size === 0) {
		return (
			<p className="py-12 text-center text-muted-foreground">
				Nothing on the Calendar in {fmtMonth(month)}.
			</p>
		);
	}
	return (
		<ol className="divide-y rounded-lg border">
			{[...byDay].map(([day, list]) => (
				<li className="grid grid-cols-[8rem_1fr] gap-4 p-3" key={day}>
					<p className="font-medium text-sm">
						{fmt(day, { day: "numeric", month: "short", weekday: "short" })}
					</p>
					<ul className="space-y-1">
						{list.map((it) => (
							<li key={it.key}>
								<Popover>
									<PopoverTrigger asChild>
										<button
											className={`flex w-full items-center gap-2 rounded px-1 py-0.5 text-left text-sm hover:bg-muted ${isOff(it) ? "text-muted-foreground line-through" : ""}`}
											type="button"
										>
											<span
												className={`size-2.5 rounded-full ${SOURCE_TONE[it.source].dot}`}
											/>
											<span className="w-32 shrink-0 text-muted-foreground tabular-nums">
												{whenLabel(it)}
											</span>
											<span className="truncate">{it.title}</span>
											<StatusBadge item={it} />
										</button>
									</PopoverTrigger>
									<PopoverContent className="w-80">
										<ItemDetails item={it} />
									</PopoverContent>
								</Popover>
							</li>
						))}
					</ul>
				</li>
			))}
		</ol>
	);
}

// ── B ────────────────────────────────────────────────────────────────────────

export function CalendarB({
	month,
	setMonth,
	view = "agenda",
	setView,
}: CalendarProps) {
	const [jumpTo, setJumpTo] = useState<string | null>(null);
	useEffect(() => {
		if (view === "agenda" && jumpTo) {
			document
				.getElementById(`day-${jumpTo}`)
				?.scrollIntoView({ block: "start" });
			setJumpTo(null);
		}
	}, [view, jumpTo]);
	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<MonthNav month={month} setMonth={setMonth} />
				<ViewToggle setView={setView} view={view} />
			</div>
			{view === "agenda" ? (
				<AgendaB month={month} />
			) : (
				<DensityB
					month={month}
					onPick={(day) => {
						setJumpTo(day);
						setView("agenda");
					}}
				/>
			)}
		</div>
	);
}

function AgendaB({ month }: { month: string }) {
	const today = todayIso();
	const days = monthWeeks(month)
		.flat()
		.filter((d) => d.slice(0, 7) === month);
	const [showEarlier, setShowEarlier] = useState(false);
	const isThisMonth = today.slice(0, 7) === month;
	const visible = days.filter(
		(d) => itemsOn(d).length > 0 && (showEarlier || !isThisMonth || d >= today),
	);
	const earlier = isThisMonth
		? days.filter((d) => d < today && itemsOn(d).length > 0).length
		: 0;
	return (
		<div className="space-y-2">
			{isThisMonth && earlier > 0 && !showEarlier ? (
				<button
					className="text-muted-foreground text-sm hover:text-foreground"
					onClick={() => setShowEarlier(true)}
					type="button"
				>
					Show {earlier} earlier {earlier === 1 ? "day" : "days"} this month
				</button>
			) : null}
			{visible.length === 0 ? (
				<p className="py-12 text-center text-muted-foreground">
					Nothing on the Calendar in {fmtMonth(month)}.
				</p>
			) : null}
			<ol className="space-y-6">
				{visible.map((day) => (
					<li className="flex scroll-mt-20 gap-4" id={`day-${day}`} key={day}>
						<div
							className={`w-14 shrink-0 text-center ${day === today ? "text-primary" : ""}`}
						>
							<p className="font-semibold text-muted-foreground text-xs uppercase">
								{fmt(day, { weekday: "short" })}
							</p>
							<p className="font-semibold text-2xl leading-tight">
								{parse(day).getDate()}
							</p>
							{day === today ? <p className="text-xs">Today</p> : null}
						</div>
						<ul className="min-w-0 flex-1 divide-y rounded-lg border">
							{itemsOn(day).map((it) => (
								<AgendaRowB day={day} item={it} key={it.key} />
							))}
						</ul>
					</li>
				))}
			</ol>
		</div>
	);
}

function AgendaRowB({ item, day }: { item: CalendarItem; day: string }) {
	const Icon = SOURCE_ICON[item.source];
	const spanNote =
		item.startsOn !== item.endsOn
			? `Day ${Math.round((parse(day).getTime() - parse(item.startsOn).getTime()) / 86_400_000) + 1} of ${Math.round((parse(item.endsOn).getTime() - parse(item.startsOn).getTime()) / 86_400_000) + 1}`
			: null;
	return (
		<li>
			<details className="group">
				<summary className="flex cursor-pointer list-none items-center gap-3 p-3 hover:bg-muted/50">
					<Icon className="size-4 shrink-0 text-muted-foreground" />
					<div className="min-w-0 flex-1">
						<p
							className={`truncate font-medium text-sm ${isOff(item) ? "text-muted-foreground line-through" : ""}`}
						>
							{item.title}
						</p>
						<p className="text-muted-foreground text-xs">
							{SOURCE_LABEL[item.source]} ·{" "}
							{item.startTime ? whenLabel(item).split(", ").at(-1) : "All day"}
							{spanNote ? ` · ${spanNote}` : ""}
							{item.source === "holiday" ? " · Offices closed" : ""}
						</p>
					</div>
					<StatusBadge item={item} />
					<ChevronRight className="size-4 text-muted-foreground transition-transform group-open:rotate-90" />
				</summary>
				<div className="border-t bg-muted/30 p-3 pl-10">
					<ItemDetails item={item} />
				</div>
			</details>
		</li>
	);
}

function DensityB({
	month,
	onPick,
}: {
	month: string;
	onPick: (day: string) => void;
}) {
	const today = todayIso();
	return (
		<div className="grid grid-cols-7 gap-1">
			{WEEKDAYS.map((d) => (
				<div className="pb-1 text-center text-muted-foreground text-xs" key={d}>
					{d}
				</div>
			))}
			{monthWeeks(month)
				.flat()
				.map((day) => {
					const list = itemsOn(day);
					const inMonth = day.slice(0, 7) === month;
					const holiday = list.find((i) => i.source === "holiday");
					return (
						<button
							className={`flex aspect-square flex-col items-start rounded-md border p-1.5 text-left hover:border-primary disabled:opacity-40 ${holiday ? "bg-chart-4/10" : ""} ${day === today ? "ring-2 ring-primary" : ""}`}
							disabled={!inMonth || list.length === 0}
							key={day}
							onClick={() => onPick(day)}
							type="button"
						>
							<span className="font-medium text-sm">
								{parse(day).getDate()}
							</span>
							{holiday ? (
								<span className="line-clamp-1 text-[10px] text-muted-foreground">
									{holiday.title}
								</span>
							) : null}
							<span className="mt-auto flex flex-wrap gap-0.5">
								{list.map((it) => {
									const Icon = SOURCE_ICON[it.source];
									return (
										<Icon
											className={`size-3.5 ${isOff(it) ? "opacity-30" : "text-foreground/70"}`}
											key={it.key}
										/>
									);
								})}
							</span>
						</button>
					);
				})}
		</div>
	);
}

// ── C ────────────────────────────────────────────────────────────────────────

export function CalendarC({ month, setMonth }: CalendarProps) {
	const today = todayIso();
	const [selected, setSelected] = useState(
		today.slice(0, 7) === month ? today : `${month}-01`,
	);
	const [showCancelled, setShowCancelled] = useState(false);
	const keep = (it: CalendarItem) => showCancelled || it.status !== "cancelled";
	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<MonthNav
					month={month}
					setMonth={(m) => {
						setMonth(m);
						setSelected(m === today.slice(0, 7) ? today : `${m}-01`);
					}}
				/>
				<div className="flex items-center gap-2">
					<Switch
						checked={showCancelled}
						id="show-cancelled"
						onCheckedChange={setShowCancelled}
					/>
					<Label htmlFor="show-cancelled">Show cancelled</Label>
				</div>
			</div>
			<div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
				<div className="overflow-hidden rounded-lg border">
					<div className="grid grid-cols-7 border-b text-center text-muted-foreground text-xs">
						{WEEKDAYS.map((d) => (
							<div className="py-1.5" key={d}>
								{d}
							</div>
						))}
					</div>
					<div className="grid grid-cols-7">
						{monthWeeks(month)
							.flat()
							.map((day) => {
								const list = itemsOn(day).filter(keep).sort(compareItems);
								const inMonth = day.slice(0, 7) === month;
								const holiday = list.some((i) => i.source === "holiday");
								return (
									<button
										aria-pressed={day === selected}
										className={`flex min-h-24 flex-col gap-0.5 border-r border-b p-1 text-left last:border-r-0 [&:nth-child(7n)]:border-r-0 ${inMonth ? "" : "bg-muted/40 text-muted-foreground"} ${holiday ? "bg-chart-4/10" : ""} ${day === selected ? "outline-2 outline-primary -outline-offset-2" : ""}`}
										key={day}
										onClick={() => setSelected(day)}
										type="button"
									>
										<span
											className={`mb-0.5 text-xs ${day === today ? "font-bold text-primary" : ""}`}
										>
											{parse(day).getDate()}
										</span>
										{list.slice(0, 3).map((it) => {
											const Icon = SOURCE_ICON[it.source];
											return (
												<span
													className={`flex items-center gap-1 truncate rounded-sm border-l-2 px-1 text-[11px] leading-4 ${SOURCE_TONE[it.source].border} ${SOURCE_TONE[it.source].soft} ${isOff(it) ? "line-through opacity-60" : ""}`}
													key={it.key}
												>
													<Icon className="size-3 shrink-0" />
													<span className="truncate">{it.title}</span>
												</span>
											);
										})}
										{list.length > 3 ? (
											<span className="text-[11px] text-muted-foreground">
												+{list.length - 3} more
											</span>
										) : null}
									</button>
								);
							})}
					</div>
				</div>
				<aside className="space-y-4 rounded-lg border p-4 lg:sticky lg:top-4 lg:self-start">
					<h3 className="font-semibold">{fmtLong(selected)}</h3>
					{itemsOn(selected).filter(keep).length === 0 ? (
						<p className="text-muted-foreground text-sm">
							Nothing on this day.
						</p>
					) : (
						itemsOn(selected)
							.filter(keep)
							.map((it) => (
								<div
									className={`border-l-4 pl-3 ${SOURCE_TONE[it.source].border}`}
									key={it.key}
								>
									<ItemDetails item={it} />
								</div>
							))
					)}
				</aside>
			</div>
		</div>
	);
}

export const CALENDAR_VARIANTS = [
	{ Component: CalendarA, key: "A", name: "Month grid + popovers" },
	{ Component: CalendarB, key: "B", name: "Agenda first" },
	{ Component: CalendarC, key: "C", name: "Grid + day panel" },
];
