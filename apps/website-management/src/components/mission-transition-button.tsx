import {
	formatDateShort,
	toDateOnlyString,
	toLocalDateOnly,
} from "@mcmec/lib/functions/date-fns";
import { LifecycleButton } from "@mcmec/ui/blocks/lifecycle-button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@mcmec/ui/components/alert-dialog";
import { Button } from "@mcmec/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@mcmec/ui/components/dialog";
import { Label } from "@mcmec/ui/components/label";
import { DateTimeInput } from "@mcmec/ui/inputs/datetime-input";
import { useId, useState } from "react";
import type { MissionTransition } from "@/src/lib/spray-mission-transitions";

/**
 * One legal move on a Spray Mission, with whatever it has to ask before it fires.
 *
 * Three shapes, decided by the transition rather than by the screen, so the detail view and any
 * other caller cannot end up guarding the same command differently:
 *
 * - **Nothing to ask** — Reschedule. A plain `LifecycleButton`; it puts a mission back on the
 *   public schedule, which is the forward act and the undo for the other two.
 * - **Ask first** — Cancel and Mark Complete. An `AlertDialog` naming the mission and saying
 *   what the public will see, per DESIGN.md's Confirm Is For The Public rule.
 * - **Ask for a rain date** — Delay. A `Dialog` with a real date field, because `CONTEXT.md`
 *   says a Delayed mission carries a rain date and the button used not to ask for one.
 *
 * The rain date rides back out through `onAct` rather than being written here: the caller owns
 * the collection and composes the Save-and-Delay, which is what keeps the command vocabulary in
 * the route (ADR 0001).
 */
export function MissionTransitionButton({
	missionName,
	onAct,
	rainDate,
	size,
	transition,
}: {
	/** The mission's own name — its date and area. Quoted back in every dialog. */
	missionName: string;
	/**
	 * `rainDate` is present only for a transition that collected one, and is the date the user
	 * chose. `null` means they cleared it.
	 */
	onAct: (extra?: { rainDate: string | null }) => void;
	/**
	 * The mission's current rain date, so the Delay dialog opens on what is already there.
	 *
	 * Widened to `Date` because the collection row carries one while the command payload takes
	 * the `YYYY-MM-DD` string — this component reads the row and hands back the string.
	 */
	rainDate?: Date | string | null;
	size?: React.ComponentProps<typeof Button>["size"];
	transition: MissionTransition;
}) {
	const [confirming, setConfirming] = useState(false);
	const [delaying, setDelaying] = useState(false);
	// `toLocalDateOnly`, not `new Date`, and that is the whole of it: a `date` column reads back
	// as UTC midnight, and `<Calendar selected>` compares against the local day, so the picker
	// opened one day before the date printed on the button beside it. An operator who trusted
	// the highlight and "corrected" it wrote the wrong rain date to the public schedule.
	const [draftRainDate, setDraftRainDate] = useState<Date | undefined>(
		toLocalDateOnly(rainDate),
	);
	const rainDateId = useId();
	const rainHintId = useId();

	const button = (
		<LifecycleButton
			icon={transition.icon}
			label={transition.label}
			onAct={() => {
				if (transition.collectsRainDate) {
					setDraftRainDate(toLocalDateOnly(rainDate));
					setDelaying(true);
					return;
				}
				if (transition.confirm) {
					setConfirming(true);
					return;
				}
				onAct();
			}}
			size={size}
		/>
	);

	return (
		<>
			{button}

			{transition.confirm ? (
				<AlertDialog onOpenChange={setConfirming} open={confirming}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>{transition.confirm.title}</AlertDialogTitle>
							<AlertDialogDescription>
								{transition.confirm.describe(missionName)}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Keep as is</AlertDialogCancel>
							<AlertDialogAction onClick={() => onAct()}>
								{transition.confirm.actionLabel}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			) : null}

			{transition.collectsRainDate ? (
				<Dialog onOpenChange={setDelaying} open={delaying}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Delay this mission?</DialogTitle>
							<DialogDescription>
								{missionName} will show as Delayed on the public spray schedule.
								A delayed mission carries a rain date — the night it is expected
								to run instead.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-2 py-2">
							<Label htmlFor={rainDateId}>Rain date</Label>
							<DateTimeInput
								aria-describedby={rainHintId}
								className="w-full"
								id={rainDateId}
								onChange={setDraftRainDate}
								placeholder="Select the rain date"
								value={draftRainDate}
							/>
							{/* Stated rather than enforced: the domain deliberately declined to make
							    rain_date a precondition of delaying, so this says what is missing
							    instead of blocking the button on it. */}
							<p className="text-muted-foreground text-sm" id={rainHintId}>
								{draftRainDate
									? `The public schedule will show ${formatDateShort(draftRainDate)} as the rain date.`
									: "Without a rain date the public schedule shows the mission as delayed with no replacement night."}
							</p>
						</div>
						<DialogFooter>
							<Button onClick={() => setDelaying(false)} variant="outline">
								Keep as is
							</Button>
							<Button
								onClick={() => {
									setDelaying(false);
									onAct({ rainDate: toDateOnlyString(draftRainDate) });
								}}
							>
								Delay Mission
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			) : null}
		</>
	);
}
