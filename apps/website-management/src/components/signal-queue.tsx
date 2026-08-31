import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@mcmec/ui/components/empty";
import { Link, type LinkProps } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import type * as React from "react";

/**
 * One row vocabulary for every queue the dashboard's signal band opens.
 *
 * The five queues cover four different domains, and left to themselves each would have grown its
 * own row: a Notice with its title left and badge right, a Spray Mission with an area and a time
 * range, a Public Request with a name and an address. Five arrangements on one surface is how a
 * dashboard stops being scannable — the eye has to re-learn where the important word sits every
 * time the panel changes.
 *
 * So every record, whatever it is, reduces to the same four slots: what it is (`primary`), where or
 * who (`secondary`), when (`meta`, in tabular figures so the column holds), and what state it is in
 * (`badge`, always carrying the word). Switching signals then changes the content and nothing about
 * where to look.
 */
export type QueueItem = {
	/** The record's state, always as a `Badge` carrying the word. */
	badge?: React.ReactNode;
	id: string;
	/** Typed route link for the record's detail screen. */
	linkProps: LinkProps;
	/** When — a date, a time range, an age. Right-aligned in tabular figures. */
	meta?: string;
	/** What this record is. Truncates rather than wrapping; the row stays one line tall. */
	primary: string;
	/** Where or who. */
	secondary?: string;
};

export function SignalQueue({
	emptyDescription,
	emptyIcon: EmptyIcon,
	emptyTitle,
	items,
}: {
	emptyDescription: string;
	emptyIcon: LucideIcon;
	emptyTitle: string;
	items: QueueItem[];
}) {
	if (items.length === 0) {
		return (
			<Empty className="border-0 py-10">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<EmptyIcon />
					</EmptyMedia>
					<EmptyTitle className="font-medium text-sm">{emptyTitle}</EmptyTitle>
					<EmptyDescription className="text-xs">
						{emptyDescription}
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<ul>
			{items.map((item) => (
				<li className="border-b last:border-b-0" key={item.id}>
					<Link
						{...item.linkProps}
						className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-2.5 transition-colors hover:bg-secondary focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
					>
						<div className="min-w-0">
							<p className="truncate font-medium text-sm leading-tight">
								{item.primary}
							</p>
							{item.secondary ? (
								<p className="truncate text-muted-foreground text-xs leading-tight">
									{item.secondary}
								</p>
							) : null}
						</div>
						<div className="flex shrink-0 items-center gap-3">
							{item.meta ? (
								<span className="text-muted-foreground text-xs tabular-nums">
									{item.meta}
								</span>
							) : null}
							{item.badge}
						</div>
					</Link>
				</li>
			))}
		</ul>
	);
}
