import type { CommandName } from "@mcmec/domain";
import type { SprayScheduleStatus } from "@mcmec/schemas/db/spray-schedules";
import {
	CalendarCheck,
	CalendarClock,
	CalendarOff,
	CalendarPlus,
} from "lucide-react";

/**
 * A spray mission's legal moves, in one place.
 *
 * ADR 0001 replaces the status `<Select>` with one button per transition, and the moves a
 * screen offers are then a real question rather than "every value in the enum". Both screens
 * that can move a mission — the detail view and the edit form — read this list, so they cannot
 * offer different sets.
 *
 * **These are offers, not preconditions.** #134 declined to invent a transition ordering and
 * #162 keeps that deferral, so the server accepts any of the four commands from any state. What
 * this table encodes is which moves make sense from where the mission is now — the same
 * judgement the dropdown was making implicitly by listing four states and letting the user pick.
 *
 * `completed` is terminal (#157) and has no entry. `cancelled` and `delayed` both offer
 * Reschedule, which is the route back to `scheduled` that the dropdown supplied and no command
 * did until #157 noticed.
 */
export interface MissionTransition {
	command: CommandName;
	/** The action's own name. `LifecycleButton` prefixes "Save and " when the form is dirty. */
	label: string;
	icon: React.ReactNode;
	/** The status the mission lands in — the optimistic half of the write. */
	to: SprayScheduleStatus;
	failure: string;
	/**
	 * Ask first, per DESIGN.md's Confirm Is For The Public rule.
	 *
	 * A Spray Mission is on the public spray schedule, and residents close windows and move pets
	 * because of it — so withdrawing one or declaring it over is exactly the case the rule is
	 * about. Cancelling a Meeting had asked since #161; cancelling a Mission, the record with the
	 * more immediate physical consequence, did not, because the rule was swept through the
	 * domains that were cut over first and never reached this one.
	 *
	 * Reschedule is deliberately unguarded. It puts a mission back on the public schedule rather
	 * than taking one off it — the forward act, and the one that undoes the guarded ones.
	 */
	confirm?: {
		title: string;
		/** Names the record. `mission` is its date and area — never "this record". */
		describe: (mission: string) => string;
		/** The button that performs it — the verb, never "OK". */
		actionLabel: string;
	};
	/**
	 * Collect a rain date before firing, as a Save-and-Delay.
	 *
	 * `CONTEXT.md`: "A Delayed mission carries a rain date." The button set the status and never
	 * asked for one, so the mission landed in a state the glossary calls incomplete and nothing
	 * said so. `delaySprayMission` takes no payload by design — the domain module already spells
	 * out the answer: `updateSprayMissionDetails` then `delaySprayMission`, one request, one
	 * transaction.
	 */
	collectsRainDate?: boolean;
}

const DELAY: MissionTransition = {
	collectsRainDate: true,
	command: "website.delaySprayMission",
	failure: "Failed to delay the mission.",
	icon: <CalendarClock />,
	label: "Delay Mission",
	to: "delayed",
};

const CANCEL: MissionTransition = {
	command: "website.cancelSprayMission",
	confirm: {
		actionLabel: "Cancel Mission",
		describe: (mission) =>
			`${mission} will show as Cancelled on the public spray schedule immediately. The mission stays on the record and can be rescheduled.`,
		title: "Cancel this mission on the public schedule?",
	},
	failure: "Failed to cancel the mission.",
	icon: <CalendarOff />,
	label: "Cancel Mission",
	to: "cancelled",
};

const COMPLETE: MissionTransition = {
	command: "website.completeSprayMission",
	confirm: {
		actionLabel: "Mark Complete",
		describe: (mission) =>
			`${mission} will show as Completed on the public spray schedule. Completed is the one status with no way back — it offers no further transition.`,
		title: "Mark this mission complete?",
	},
	failure: "Failed to complete the mission.",
	icon: <CalendarCheck />,
	label: "Mark Complete",
	to: "completed",
};

const RESCHEDULE: MissionTransition = {
	command: "website.rescheduleSprayMission",
	failure: "Failed to reschedule the mission.",
	icon: <CalendarPlus />,
	label: "Reschedule Mission",
	to: "scheduled",
};

export function transitionsFrom(
	status: SprayScheduleStatus,
): MissionTransition[] {
	switch (status) {
		case "scheduled":
			return [DELAY, CANCEL, COMPLETE];
		case "delayed":
			return [RESCHEDULE, CANCEL, COMPLETE];
		case "cancelled":
			return [RESCHEDULE];
		case "completed":
			return [];
	}
}
