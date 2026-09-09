import { Trash2 } from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "../components/alert-dialog";
import { Button } from "../components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../components/card";

/**
 * Where `delete*` lives, and the one lifecycle action whose placement is not free.
 *
 * ADR 0001 makes every other lifecycle action a button that may appear wherever it is
 * convenient. Delete is the exception: detail page only, in this card, behind a confirm dialog.
 * The reason is that the other actions are reversible by their opposite command and this one is
 * not, so its cost has to be visible before the click rather than explained after it.
 *
 * Presentational on purpose. It knows nothing about commands, collections or intents — the
 * caller owns `onConfirm`, which is what keeps `@mcmec/ui` free of a dependency on the
 * vocabulary.
 */
export function DangerZoneCard({
	confirmLabel = "Delete",
	confirmTitle,
	description,
	disabled,
	label,
	onConfirm,
	recordName,
	title = "Danger Zone",
}: {
	/** The dialog's confirm button. Defaults to "Delete". */
	confirmLabel?: string;
	/**
	 * What the dialog warns. Defaults to a sentence naming `recordName`; pass this when the
	 * record takes something with it — child rows, a published page, a sent invitation.
	 */
	description?: React.ReactNode;
	disabled?: boolean;
	/** The card's own button — "Delete Notice", "Delete Meeting". */
	label: string;
	onConfirm: () => void;
	/** Quoted back in the default warning so the user can see they are on the right record. */
	recordName?: string;
	/** The card's heading. Defaults to "Danger Zone". */
	title?: string;
	/**
	 * The dialog's own heading. Defaults to a question naming the record.
	 *
	 * It used to read "Are you absolutely sure?" — a shadcn default, and the weakest copy in the
	 * product sitting on its most consequential control. `row-actions-menu.tsx` had already
	 * written the rule down one file over: say "what will actually happen, naming the record. Not
	 * 'Are you sure?'". A question that names nothing cannot be answered honestly, because the
	 * one thing the person needs to check is whether they are on the right record.
	 */
	confirmTitle?: string;
}) {
	return (
		<Card className="border-destructive/50">
			<CardHeader>
				<CardTitle className="text-destructive">{title}</CardTitle>
				<CardDescription>
					Actions here cannot be undone by any other command.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button disabled={disabled} variant="destructive">
							<Trash2 />
							{label}
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>
								{confirmTitle ??
									(recordName
										? `Delete "${recordName}"?`
										: "Delete this record?")}
							</AlertDialogTitle>
							<AlertDialogDescription>
								{description ?? (
									<>
										This action cannot be undone. This will permanently delete
										{recordName ? ` "${recordName}"` : " this record"}.
									</>
								)}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction onClick={onConfirm}>
								{confirmLabel}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</CardContent>
		</Card>
	);
}
