import type { CommandName } from "@mcmec/domain";
import { CalendarOff, CalendarPlus } from "lucide-react";
import type { CentralCollection } from "@/src/lib/collections";
import { runLifecycle } from "@/src/lib/lifecycle";

type StaffEvents = CentralCollection<"staffEvents">;

/**
 * Cancel Event / Reinstate, in one place for the list's row menu, the detail view and the edit
 * form. A cancelled Staff Event stays on the Calendar marked as such (CONTEXT.md: Cancelled), so
 * the opposite of cancelling is Reinstate rather than delete.
 *
 * `save` is the edit form's half of a Save-and-X: the changed details travel with the lifecycle
 * intent in one request, and so commit or roll back together.
 */
export function staffEventLifecycle(
	staffEvents: StaffEvents,
	event: { id: string; title: string; is_cancelled: boolean },
	save?: { changes: Record<string, unknown> },
) {
	const cancelled = event.is_cancelled;
	const command: CommandName = cancelled
		? "employees.uncancelStaffEvent"
		: "employees.cancelStaffEvent";
	return {
		icon: cancelled ? <CalendarPlus /> : <CalendarOff />,
		label: cancelled ? "Reinstate" : "Cancel Event",
		onAct: (withSave = false) =>
			runLifecycle(staffEvents, event.id, {
				apply: (draft: { is_cancelled: boolean }) => {
					draft.is_cancelled = !cancelled;
				},
				command,
				failure: cancelled
					? "Failed to reinstate the event."
					: "Failed to cancel the event.",
				save:
					withSave && save
						? {
								changes: save.changes,
								command: "employees.updateStaffEventDetails",
							}
						: undefined,
				success: cancelled
					? `"${event.title}" is back on the Calendar.`
					: `"${event.title}" shows as Cancelled on the Calendar.`,
			}),
	};
}
