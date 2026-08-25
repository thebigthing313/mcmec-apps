import { MoreHorizontal } from "lucide-react";
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
	/** Accessible name for the trigger — override when one page has more than one menu kind. */
	label?: string;
}) {
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
							onSelect={() => action.onAct()}
						>
							{action.icon}
							{action.label}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
