import { cn } from "@mcmec/ui/lib/utils";
import * as React from "react";

/**
 * A band of named signals across the top of a staff screen, each opening its own queue in place.
 *
 * The problem it solves: a staff dashboard built as a grid of stat cards tells you four numbers and
 * then makes you leave the page to act on any of them. The number is not the work. This band puts
 * the counts and the queues on one surface — the count is the size of a queue you are one keypress
 * from reading, not a statistic.
 *
 * It is a tablist, deliberately, because that is what it is: a set of mutually exclusive views over
 * one region. Using the real role gets arrow-key navigation, `aria-selected`, and the panel
 * relationship for free, and staff who live in this app all day navigate by keyboard.
 *
 * Two rules from DESIGN.md shape the visuals and are not negotiable here:
 *
 * - **The One Green Rule.** Commission Green marks the *selected* cell and nothing else. It is the
 *   active-navigation state, the same job it does in the sidebar rail. An urgent signal does not
 *   get to be green, or red, or amber.
 * - **The Status Is A Word Rule.** Urgency is therefore carried by `condition` — a short phrase
 *   naming what the queue actually is ("open 5+ days", "tonight") — plus the caller's ordering, and
 *   by which signal the screen opens on. Never by colour alone.
 *
 * The band and its panel share one border, so they read as one instrument rather than a toolbar
 * sitting above an unrelated list.
 */
export type Signal = {
	/** Size of the queue this signal opens. Rendered in tabular figures. */
	count: number;
	/**
	 * One short phrase naming the queue's condition — "open 5+ days", "awaiting triage", "not yet
	 * public". This is where urgency lives, since colour may not carry it.
	 */
	condition: string;
	/** Stable key; also the value passed to `onValueChange`. */
	id: string;
	/** Sentence case, naming the queue. Not uppercase — see DESIGN.md's Uppercase Is Structural rule. */
	label: string;
	/**
	 * The queue's name in the panel header, where there is room the band cell does not have. Use it
	 * to spell a term out in full — a five-across cell can only fit "Missions tonight", but the
	 * header can say "Spray Missions tonight", which is the word the rest of the product uses.
	 * Falls back to `label`.
	 */
	panelLabel?: string;
};

export function SignalBand({
	children,
	className,
	onValueChange,
	panelActions,
	signals,
	value,
}: {
	/** The open signal's queue. */
	children: React.ReactNode;
	className?: string;
	onValueChange: (id: string) => void;
	/** Trailing controls for the open queue — typically its "View all" link. */
	panelActions?: React.ReactNode;
	signals: Signal[];
	value: string;
}) {
	const tabRefs = React.useRef(new Map<string, HTMLButtonElement>());
	// One panel, swapped — so one id. Keying it to the selected signal left four of five tabs
	// pointing `aria-controls` at an element that did not exist.
	const panelId = `${React.useId()}-signal-panel`;
	// The band wraps at 2 and 3 columns before it gets its 5, and any signal count that doesn't
	// divide evenly leaves the grid's own border-coloured ground showing through the trailing slot
	// as a dead grey block. These fillers close that row, per breakpoint, for any count.
	const fillers = fillerVisibility(signals.length);
	const selectedIndex = Math.max(
		0,
		signals.findIndex((s) => s.id === value),
	);
	const selected = signals[selectedIndex];

	// Roving focus. The tablist holds one tab stop; arrows move between signals and select as they
	// go, which is the automatic-activation pattern correct for panels that are already rendered.
	const move = (delta: number) => {
		const next =
			signals[(selectedIndex + delta + signals.length) % signals.length];
		if (!next) return;
		onValueChange(next.id);
		tabRefs.current.get(next.id)?.focus();
	};

	// Left/right only, and `aria-orientation="horizontal"` to say so. Below `lg` the band wraps to
	// a 2-D grid where ArrowDown would move one cell *right* — a key pointing at the wrong thing.
	const onKeyDown = (event: React.KeyboardEvent) => {
		const jump: Record<string, () => void> = {
			ArrowLeft: () => move(-1),
			ArrowRight: () => move(1),
			End: () => {
				const last = signals.at(-1);
				if (!last) return;
				onValueChange(last.id);
				tabRefs.current.get(last.id)?.focus();
			},
			Home: () => {
				const first = signals[0];
				if (!first) return;
				onValueChange(first.id);
				tabRefs.current.get(first.id)?.focus();
			},
		};
		const handler = jump[event.key];
		if (!handler) return;
		event.preventDefault();
		handler();
	};

	return (
		<section
			aria-label="What needs you"
			className={cn("overflow-hidden rounded-xl border bg-card", className)}
		>
			{/*
			 * gap-px over a border-coloured ground draws every divider at once and keeps them exact
			 * when the cells wrap — which they do at every width below lg, since a five-cell band is
			 * a desktop shape and a phone is a state this screen must survive, not target.
			 */}
			<div
				aria-label="Signals"
				aria-orientation="horizontal"
				className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 lg:grid-cols-5"
				onKeyDown={onKeyDown}
				role="tablist"
			>
				{signals.map((signal) => {
					const isSelected = signal.id === value;
					return (
						<button
							aria-controls={panelId}
							aria-selected={isSelected}
							className={cn(
								"relative flex flex-col items-start gap-0.5 px-4 py-3 text-left transition-colors",
								"focus-visible:z-10 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
								isSelected
									? "bg-primary text-primary-foreground"
									: "bg-card hover:bg-secondary",
							)}
							id={`signal-tab-${signal.id}`}
							key={signal.id}
							onClick={() => onValueChange(signal.id)}
							ref={(node) => {
								if (node) tabRefs.current.set(signal.id, node);
								else tabRefs.current.delete(signal.id);
							}}
							role="tab"
							tabIndex={isSelected ? 0 : -1}
							type="button"
						>
							{/*
							 * Tabular figures so the counts hold a common baseline grid as they change —
							 * a live number that reflows its neighbours reads as instability.
							 *
							 * A zero recedes. Five counts at equal weight make an empty signal shout as
							 * loudly as a full one, and the whole point of the band is that the eye lands
							 * on the queue holding actual work.
							 */}
							<span
								className={cn(
									"font-semibold text-2xl tabular-nums leading-none",
									signal.count === 0 &&
										(isSelected
											? "text-primary-foreground/70"
											: "text-muted-foreground"),
								)}
							>
								{signal.count}
							</span>
							<span className="font-medium text-sm leading-tight">
								{signal.label}
							</span>
							{/*
							 * On the green cell the secondary line tints from the foreground rather than
							 * dropping to muted grey, which would fall under 4.5:1 against Commission Green.
							 */}
							<span
								className={cn(
									"text-xs leading-tight",
									isSelected
										? "text-primary-foreground/90"
										: "text-muted-foreground",
								)}
							>
								{signal.condition}
							</span>
							{/*
							 * The tongue joining the lit cell to its panel. Only drawn on the single-row
							 * band; once the cells wrap it would point into another cell instead of the
							 * panel, and a pointer aimed at the wrong thing is worse than none.
							 */}
							{isSelected ? (
								<span
									aria-hidden="true"
									className="absolute -bottom-1 left-1/2 z-10 hidden size-2 -translate-x-1/2 rotate-45 bg-primary lg:block"
								/>
							) : null}
						</button>
					);
				})}
				{fillers.map((className, index) => (
					<div
						aria-hidden="true"
						className={cn("bg-card", className)}
						// biome-ignore lint/suspicious/noArrayIndexKey: fillers are positional and interchangeable
						key={`filler-${index}`}
						role="presentation"
					/>
				))}
			</div>

			<div
				aria-labelledby={`signal-tab-${value}`}
				className="border-t"
				id={panelId}
				role="tabpanel"
				// A tabpanel whose content may be entirely non-focusable — an empty queue is exactly
				// that — has to be focusable itself, or a keyboard user arrowing onto it lands nowhere
				// and cannot read it. This is the WAI-ARIA tabs pattern, not a stray tabIndex.
				// biome-ignore lint/a11y/noNoninteractiveTabindex: required by the WAI-ARIA tabs pattern
				tabIndex={0}
			>
				<div className="flex items-center justify-between gap-4 border-b px-4 py-2.5">
					<h2 className="font-medium text-sm">
						{selected?.panelLabel ?? selected?.label}
						{selected ? (
							<span className="ml-2 font-normal text-muted-foreground">
								{selected.condition}
							</span>
						) : null}
					</h2>
					{panelActions ? (
						<div className="flex shrink-0 items-center gap-2">
							{panelActions}
						</div>
					) : null}
				</div>
				{/*
				 * The screen's one authored moment: swapping queues settles rather than cuts. Keyed on
				 * the signal so it replays per switch, and short enough that a keyboard user arrowing
				 * across the band is never waiting on it.
				 */}
				{/*
				 * A floor under the panel. Without it, moving from a full queue to an empty one
				 * collapses the instrument and drags the public-record strip up the page — the band
				 * becomes a thing that jumps rather than a thing you read across.
				 *
				 * Dropped below `sm`, where it costs more than it buys: the band alone already fills a
				 * phone, so the floor buys stability nobody can see while pushing the public record a
				 * whole screen further down. Narrow reflows; that is the point of reflowing.
				 */}
				<div
					className="fade-in-0 slide-in-from-top-1 animate-in duration-200 motion-reduce:animate-none sm:min-h-70"
					key={value}
				>
					{children}
				</div>
			</div>
		</section>
	);
}

/** Column counts the band steps through: base, `sm`, and `lg`. */
const BAND_COLUMNS = [2, 3, 5] as const;
const BAND_PREFIXES = ["", "sm:", "lg:"] as const;

/**
 * One class string per filler cell needed to square off the grid, each showing only at the
 * breakpoints whose column count actually leaves a gap.
 */
function fillerVisibility(count: number): string[] {
	const needed = BAND_COLUMNS.map((cols) => (cols - (count % cols)) % cols);
	return Array.from({ length: Math.max(...needed) }, (_, index) =>
		BAND_PREFIXES.map(
			(prefix, breakpoint) =>
				`${prefix}${index < (needed[breakpoint] ?? 0) ? "block" : "hidden"}`,
		).join(" "),
	);
}
