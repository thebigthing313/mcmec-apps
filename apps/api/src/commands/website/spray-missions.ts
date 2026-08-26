/**
 * Handlers for the seven `spray_schedules` commands.
 *
 * This is the module where the cutover's clearest correctness win lands. Under the old path a
 * mission was saved by two non-atomic HTTP writes behind one button — `PATCH /api/data/
 * spray_schedules` and then `PUT /api/spray-schedules/:id/municipalities` — so a failed second
 * write left a committed schedule with no municipalities and the user with a success toast.
 * Both tables now move inside the request's shared transaction, so they land together or not
 * at all. `spray-municipalities.ts` is deleted with this slice; its full-replace logic is
 * `replaceMunicipalities` below, minus the transaction and the permission check, which the
 * dispatcher already owns.
 */
import type { sprayMissions as sprayCommands } from "@mcmec/domain";
import { eq } from "drizzle-orm";
import type { Tx } from "../../actor";
import { sprayScheduleMunicipalities, spraySchedules } from "../../db/schema";
import { toColumnValues } from "../columns";
import { deleteRow, NOT_FOUND, setFields } from "../rows";
import type { CommandHandler } from "../types";

/**
 * Replaces a mission's whole municipality set.
 *
 * Delete-then-insert rather than a diff: the client sends the set it wants, the junction's real
 * key is the `(spray_schedule_id, municipality_id)` pair, and there is nothing else on the row
 * to preserve. An unknown municipality id surfaces as a foreign-key violation, which the
 * dispatcher's catch-all maps to 422 — bad input, not a conflict, and not something a sentence
 * written for the user would improve on, since only a broken client can send one.
 *
 * This stays here rather than in `rows.ts`: it is not row-scoped, and #158 drew the line that
 * nothing shared may grow past "one write against one row addressed by the envelope id".
 */
async function replaceMunicipalities(
	tx: Tx,
	sprayScheduleId: string,
	municipalityIds: string[],
): Promise<void> {
	await tx
		.delete(sprayScheduleMunicipalities)
		.where(eq(sprayScheduleMunicipalities.sprayScheduleId, sprayScheduleId));
	if (municipalityIds.length === 0) return;
	await tx.insert(sprayScheduleMunicipalities).values(
		municipalityIds.map((municipalityId) => ({
			municipalityId,
			sprayScheduleId,
		})),
	);
}

export const createSprayMission: CommandHandler<
	typeof sprayCommands.createSprayMission
> = async ({ payload, id, tx }) => {
	// The envelope id is honoured, so the optimistic row's key IS the committed row's id. It
	// also names the schedule the junction rows point at, which is why the create can write
	// both tables in one go instead of waiting for a generated id to come back.
	await tx.insert(spraySchedules).values({
		id,
		status: "scheduled",
		...toColumnValues(spraySchedules, payload),
	} as typeof spraySchedules.$inferInsert);
	await replaceMunicipalities(tx, id, payload.municipality_ids);
};

export const updateSprayMissionDetails: CommandHandler<
	typeof sprayCommands.updateSprayMissionDetails
> = async ({ payload, id, tx }) => {
	const values = toColumnValues(spraySchedules, payload);

	if (Object.keys(values).length > 0) {
		await setFields(tx, spraySchedules, id, values);
	} else {
		// A municipality-only save carries no column of this table, so there is nothing to set
		// — but the row still has to exist, and the FK violation the junction insert would
		// raise says "invalid" where the truth is "gone". An empty set of municipalities would
		// not even raise that.
		const [row] = await tx
			.select({ id: spraySchedules.id })
			.from(spraySchedules)
			.where(eq(spraySchedules.id, id));
		if (!row) throw NOT_FOUND;
	}

	// Absent means "not part of this save", which is not the same as `[]` — the empty array is
	// how a user clears the set, and it has to survive as a real instruction.
	if (payload.municipality_ids !== undefined) {
		await replaceMunicipalities(tx, id, payload.municipality_ids);
	}
};

// The four transitions. #134 declined to invent an ordering between statuses and #162 keeps
// that deferral, so each of these is a plain named `set` and the server accepts any transition
// from any state. Which buttons a screen offers is presentation — the detail view shows the
// moves that make sense from where the mission is now.
export const cancelSprayMission: CommandHandler<
	typeof sprayCommands.cancelSprayMission
> = async ({ id, tx }) => {
	await setFields(tx, spraySchedules, id, { status: "cancelled" });
};

export const completeSprayMission: CommandHandler<
	typeof sprayCommands.completeSprayMission
> = async ({ id, tx }) => {
	await setFields(tx, spraySchedules, id, { status: "completed" });
};

export const delaySprayMission: CommandHandler<
	typeof sprayCommands.delaySprayMission
> = async ({ id, tx }) => {
	await setFields(tx, spraySchedules, id, { status: "delayed" });
};

export const rescheduleSprayMission: CommandHandler<
	typeof sprayCommands.rescheduleSprayMission
> = async ({ id, tx }) => {
	await setFields(tx, spraySchedules, id, { status: "scheduled" });
};

export const deleteSprayMission: CommandHandler<
	typeof sprayCommands.deleteSprayMission
> = async ({ id, tx }) => {
	// No foreign-key mapping here, unlike the deleting handlers in the lookup-table slice: the
	// junction is the only referrer and it is `on delete cascade`, so the mission takes its
	// municipality links with it by construction rather than by a query written here.
	await deleteRow(tx, spraySchedules, id);
};
