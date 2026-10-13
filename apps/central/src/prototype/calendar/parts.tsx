/**
 * PROTOTYPE — throwaway (#299). Pieces every variant may borrow: how a source is coloured and
 * iconed, and what an item's details say. Layout is deliberately NOT shared.
 */
import { Badge } from "@mcmec/ui/components/badge";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Flag, Landmark, SprayCan, Users } from "lucide-react";
import type * as React from "react";
import {
	type CalendarItem,
	fmtLong,
	fmtShort,
	SOURCE_LABEL,
	type Source,
	whenLabel,
} from "./data";

export const SOURCE_ICON: Record<
	Source,
	React.ComponentType<{ className?: string }>
> = {
	holiday: Flag,
	meeting: Landmark,
	sprayMission: SprayCan,
	staffEvent: Users,
};

/** Solid fill (bars), soft fill (chips), and a dot. */
export const SOURCE_TONE: Record<
	Source,
	{ solid: string; soft: string; dot: string; border: string }
> = {
	holiday: {
		border: "border-l-chart-4",
		dot: "bg-chart-4",
		soft: "bg-chart-4/15 text-foreground",
		solid: "bg-chart-4 text-white",
	},
	meeting: {
		border: "border-l-chart-1",
		dot: "bg-chart-1",
		soft: "bg-chart-1/15 text-foreground",
		solid: "bg-chart-1 text-white",
	},
	sprayMission: {
		border: "border-l-chart-3",
		dot: "bg-chart-3",
		soft: "bg-chart-3/15 text-foreground",
		solid: "bg-chart-3 text-white",
	},
	staffEvent: {
		border: "border-l-chart-5",
		dot: "bg-chart-5",
		soft: "bg-chart-5/15 text-foreground",
		solid: "bg-chart-5 text-white",
	},
};

export function StatusBadge({ item }: { item: CalendarItem }) {
	switch (item.status) {
		case "cancelled":
			return <Badge variant="secondary">Cancelled</Badge>;
		case "delayed":
			return <Badge variant="outline">Delayed</Badge>;
		case "rainDate":
			return <Badge variant="outline">Rain date</Badge>;
		case "completed":
			return <Badge variant="outline">Completed</Badge>;
		default:
			return null;
	}
}

/** Struck through when it is not happening on this day. */
export const isOff = (item: CalendarItem) =>
	item.status === "cancelled" || item.status === "delayed";

export function ItemDetails({ item }: { item: CalendarItem }) {
	const Icon = SOURCE_ICON[item.source];
	return (
		<div className="space-y-2 text-sm">
			<div className="flex items-center gap-2 text-muted-foreground text-xs">
				<Icon className="size-3.5" />
				{SOURCE_LABEL[item.source]}
				<StatusBadge item={item} />
			</div>
			<p
				className={`font-semibold text-base ${isOff(item) ? "line-through" : ""}`}
			>
				{item.title}
			</p>
			<p>
				{fmtLong(item.startsOn)}
				<br />
				<span className="text-muted-foreground">{whenLabel(item)}</span>
			</p>
			{item.fallsOn ? (
				<p className="text-muted-foreground">
					Falls on {fmtShort(item.fallsOn)}; offices close on the observed day.
				</p>
			) : null}
			{item.status === "delayed" && item.otherDate ? (
				<p>Moved to its rain date, {fmtShort(item.otherDate)}.</p>
			) : null}
			{item.status === "rainDate" && item.otherDate ? (
				<p>
					Rain date for the mission delayed from {fmtShort(item.otherDate)}.
				</p>
			) : null}
			{item.location ? (
				<p className="text-muted-foreground">{item.location}</p>
			) : null}
			{item.description ? <p>{item.description}</p> : null}
			<div className="flex flex-wrap gap-3 pt-1">
				{item.meetingId ? (
					// The fixture ids don't exist, so this lands on the not-found page — the real
					// thing opens the existing Portal Meeting page.
					<Link
						className="text-primary hover:underline"
						params={{ meetingId: item.meetingId }}
						to="/meetings/$meetingId"
					>
						Open meeting
					</Link>
				) : null}
				{item.url ? (
					<a
						className="inline-flex items-center gap-1 text-primary hover:underline"
						href={item.url}
						rel="noopener noreferrer"
						target="_blank"
					>
						Link <ExternalLink className="size-3" />
					</a>
				) : null}
				{item.mapUrl ? (
					<a
						className="inline-flex items-center gap-1 text-primary hover:underline"
						href={item.mapUrl}
						rel="noopener noreferrer"
						target="_blank"
					>
						Spray map <ExternalLink className="size-3" />
					</a>
				) : null}
			</div>
		</div>
	);
}

export function Legend() {
	return (
		<ul className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs">
			{(Object.keys(SOURCE_LABEL) as Source[]).map((s) => (
				<li className="flex items-center gap-1.5" key={s}>
					<span className={`size-2.5 rounded-full ${SOURCE_TONE[s].dot}`} />
					{SOURCE_LABEL[s]}
				</li>
			))}
		</ul>
	);
}
