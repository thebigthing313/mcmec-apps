/**
 * The pieces every Calendar surface draws an item with — its source's colour and icon, its
 * status badge, its details, and the legend — so the Calendar page, the Dashboard's Upcoming card
 * and the Holiday Schedule cannot disagree about what a Meeting looks like. Layout is not shared;
 * each surface owns its own.
 *
 * Under `src/apps/` because it is App code: `pnpm check-bundle` keeps it out of the entry chunk,
 * and only the lazy Portal screens import it.
 */
import { Badge } from "@mcmec/ui/components/badge";
import { cn } from "@mcmec/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Flag, Landmark, SprayCan, Users } from "lucide-react";
import type { ComponentType } from "react";
import {
	type CalendarItem,
	type CalendarSource,
	SOURCE_LABEL,
} from "@/src/lib/calendar/items";
import {
	dayLong,
	dayShort,
	isOff,
	statusLabel,
	whenLabel,
} from "@/src/lib/calendar/labels";

export const SOURCE_ICON: Record<
	CalendarSource,
	ComponentType<{ className?: string }>
> = {
	holiday: Flag,
	meeting: Landmark,
	sprayMission: SprayCan,
	staffEvent: Users,
};

/**
 * Each source's colour, from the `chart-*` tokens (#302) — DESIGN.md's one other licence for them.
 *
 * `solid` is a bar with a label on it, so its text is chosen per token and theme for 4.5:1: black
 * on every light-theme token (4.97–5.74:1), and in the dark theme black except on `chart-1`,
 * which is dark enough to need white (6.82:1). `dot` and `border` carry no text, and every token
 * clears the 3:1 a graphical object needs against the card.
 */
export const SOURCE_TONE: Record<
	CalendarSource,
	{ solid: string; soft: string; dot: string; border: string }
> = {
	holiday: {
		border: "border-chart-4",
		dot: "bg-chart-4",
		soft: "bg-chart-4/15",
		solid: "bg-chart-4 text-black",
	},
	meeting: {
		border: "border-chart-1",
		dot: "bg-chart-1",
		soft: "bg-chart-1/15",
		solid: "bg-chart-1 text-black dark:text-white",
	},
	sprayMission: {
		border: "border-chart-3",
		dot: "bg-chart-3",
		soft: "bg-chart-3/15",
		solid: "bg-chart-3 text-black",
	},
	staffEvent: {
		border: "border-chart-5",
		dot: "bg-chart-5",
		soft: "bg-chart-5/15",
		solid: "bg-chart-5 text-black",
	},
};

/** The source's colour as a dot. Decorative: the words beside it carry the meaning. */
export function SourceDot({
	source,
	className,
}: {
	source: CalendarSource;
	className?: string;
}) {
	return (
		<span
			aria-hidden="true"
			className={cn(
				"inline-block size-2.5 shrink-0 rounded-full",
				SOURCE_TONE[source].dot,
				className,
			)}
		/>
	);
}

/** The status in words; nothing for an ordinary item. */
export function StatusBadge({ item }: { item: CalendarItem }) {
	const label = statusLabel(item.status);
	if (!label) return null;
	return (
		<Badge
			className={cn(item.status === "rainDate" && "border-dashed")}
			variant={item.status === "cancelled" ? "secondary" : "outline"}
		>
			{label}
		</Badge>
	);
}

const linkClass =
	"inline-flex items-center gap-1 rounded-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring";

/**
 * Everything the Calendar knows about one item: source (icon and name, backing up the colour),
 * status, date and time, location, description and links — the body of an item's popover.
 */
export function ItemDetails({ item }: { item: CalendarItem }) {
	const Icon = SOURCE_ICON[item.source];
	return (
		<div className="space-y-2 text-sm">
			<div className="flex items-center gap-2 text-muted-foreground text-xs">
				<SourceDot source={item.source} />
				<Icon className="size-3.5" />
				{SOURCE_LABEL[item.source]}
				<StatusBadge item={item} />
			</div>
			<p
				className={cn("font-semibold text-base", isOff(item) && "line-through")}
			>
				{item.title}
			</p>
			<p>
				{dayLong(item.startsOn)}
				<br />
				<span className="text-muted-foreground">{whenLabel(item)}</span>
			</p>
			{item.fallsOn ? (
				<p className="text-muted-foreground">
					Falls on {dayShort(item.fallsOn)}; offices close on the observed day.
				</p>
			) : null}
			{item.status === "delayed" && item.otherDate ? (
				<p>Moved to its rain date, {dayShort(item.otherDate)}.</p>
			) : null}
			{item.status === "rainDate" && item.otherDate ? (
				<p>
					Rain date for the mission delayed from {dayShort(item.otherDate)}.
				</p>
			) : null}
			{item.status === "completed" && item.otherDate ? (
				<p>
					Carried out on its rain date; first set for {dayShort(item.otherDate)}
					.
				</p>
			) : null}
			{item.location && item.location !== item.title ? (
				<p className="text-muted-foreground">{item.location}</p>
			) : null}
			{item.description ? (
				<p className="whitespace-pre-line">{item.description}</p>
			) : null}
			{item.meetingId || item.url || item.mapUrl ? (
				<div className="flex flex-wrap gap-3 pt-1">
					{item.meetingId ? (
						<Link
							className={linkClass}
							params={{ meetingId: item.meetingId }}
							to="/meetings/$meetingId"
						>
							Open meeting
						</Link>
					) : null}
					{item.url ? (
						<a
							className={linkClass}
							href={item.url}
							rel="noopener noreferrer"
							target="_blank"
						>
							Link <ExternalLink className="size-3" />
						</a>
					) : null}
					{item.mapUrl ? (
						<a
							className={linkClass}
							href={item.mapUrl}
							rel="noopener noreferrer"
							target="_blank"
						>
							Spray map <ExternalLink className="size-3" />
						</a>
					) : null}
				</div>
			) : null}
		</div>
	);
}

/** Which colour is which, in words. */
export function Legend({ className }: { className?: string }) {
	return (
		<ul
			aria-label="Legend"
			className={cn(
				"flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs",
				className,
			)}
		>
			{(Object.keys(SOURCE_LABEL) as CalendarSource[]).map((source) => (
				<li className="flex items-center gap-1.5" key={source}>
					<SourceDot source={source} />
					{SOURCE_LABEL[source]}
				</li>
			))}
		</ul>
	);
}
