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
}

const DELAY: MissionTransition = {
	command: "website.delaySprayMission",
	failure: "Failed to delay the mission.",
	icon: <CalendarClock />,
	label: "Delay Mission",
	to: "delayed",
};

const CANCEL: MissionTransition = {
	command: "website.cancelSprayMission",
	failure: "Failed to cancel the mission.",
	icon: <CalendarOff />,
	label: "Cancel Mission",
	to: "cancelled",
};

const COMPLETE: MissionTransition = {
	command: "website.completeSprayMission",
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
