import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../components/alert-dialog";
import { Button } from "../components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../components/dropdown-menu";

/** One entry in the menu. `label` is the action's own name — "Publish", "Close", "Reopen". */
export interface RowAction {
	label: string;
	icon?: React.ReactNode;
	disabled?: boolean;
	onAct: () => void;
	/**
	 * Ask first, for an action whose consequence is public and immediate.
	 *
	 * Unpublishing a Notice takes a statutorily posted legal notice off the public website, and
	 * before this existed it was one click inside a menu with no confirmation and no undo —
	 * while `delete*`, which is *less* publicly consequential, had a whole danger zone. The test
	 * is not "is it destructive" but "does a stranger see the result immediately".
	 */
	confirm?: {
		title: string;
		/** What will actually happen, naming the record. Not "Are you sure?". */
		description: string;
		/** The button that performs it — the verb, never "OK". */
		actionLabel: string;
	};
}

/**
 * The shortcut surface ADR 0001 allows on a list row.
 *
 * A row may reach a lifecycle command, but never *only* from the row — everything here is also
 * on the detail view, which is what lets a table ship with no action column and still be
 * complete. `delete*` is not allowed here at all: it lives in the danger zone on the detail
 * page and nowhere else.
 *
 * No `isDirty` and no relabel, because there is no form under a table row: a row action always
 * sends exactly one intent.
 */
export function RowActionsMenu({
	actions,
	label = "Row actions",
}: {
	actions: RowAction[];
	/**
	 * Accessible name for the trigger. Name the record, not the control: a table of ten rows whose
	 * triggers are all called "Row actions" tells a screen reader nothing about which record is
	 * about to change. `RecordIndex` passes "Actions for <row label>" for exactly this reason.
	 */
	label?: string;
}) {
	const [pending, setPending] = useState<RowAction | null>(null);

	if (actions.length === 0) return null;

	return (
		<div className="flex justify-end">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					{/* The stop lives on the trigger, not a wrapper div: these tables make the
					    whole row a navigation target, and opening a menu is not a request to
					    leave the page. Radix's own handler runs first through `asChild`, so the
					    menu still opens. The content is portaled, so its clicks never reach the
					    row at all. */}
					<Button
						aria-label={label}
						onClick={(e) => e.stopPropagation()}
						size="icon"
						variant="ghost"
					>
						<MoreHorizontal />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					{actions.map((action) => (
						<DropdownMenuItem
							disabled={action.disabled}
							key={action.label}
							onSelect={() => {
								if (action.confirm) setPending(action);
								else action.onAct();
							}}
						>
							{action.icon}
							{action.label}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>

			<AlertDialog
				onOpenChange={(open) => {
					if (!open) setPending(null);
				}}
				open={pending !== null}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{pending?.confirm?.title}</AlertDialogTitle>
						<AlertDialogDescription>
							{pending?.confirm?.description}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								pending?.onAct();
								setPending(null);
							}}
						>
							{pending?.confirm?.actionLabel}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
