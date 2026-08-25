/**
 * `spray_schedules` — the seven commands of a spray mission.
 *
 * Six from #134, plus `rescheduleSprayMission`, which #157 added once the `<Select>` of statuses
 * became one button per transition and the vocabulary's hole became visible: a mission cancelled
 * by mistake had no route back to `scheduled`.
 *
 * **This is the one command in the vocabulary that writes two tables.** A mission's municipality
 * set lives in `spray_schedule_municipalities`, and today saving a mission is two non-atomic HTTP
 * writes behind one button (#133) — the schedule commits, then a full-replace PUT of the junction,
 * so a failed PUT leaves a committed schedule with no municipalities. `municipality_ids` is
 * therefore part of the payload: the handler replaces the set inside the same transaction that
 * writes the row, and the two either land together or roll back together.
 *
 * It is not a column of `spray_schedules`, so it cannot ride in `mutation.changes` like every
 * other field. It travels in the `arguments` metadata channel #137 added for exactly this, and
 * `toColumnValues` skips it on the way to Drizzle because it is not a column of the table.
 * #134's account of a client-side `createTransaction` across both collections is NOT what
 * happens: #137 declined to port simmer's `commandTransaction`, so the client writes one
 * collection and the server writes both tables. The junction collection stays read-only and
 * converges through Electric, exactly as it did under the old junction endpoint.
 *
 * `status` appears in no payload. It moves only through the four transition commands, which is
 * what turns ADR 0001's "one button per legal transition" from a UI convention into something
 * the payload schemas enforce.
 *
 * Three rules #134 explicitly declined to invent stay uninvented here: `end_time > start_time`,
 * `rain_date` required on a delayed mission, and any ordering between statuses. They exist
 * nowhere today, so promoting them would be new behaviour rather than the re-homing this cutover
 * is made of. Which buttons a screen offers still depends on the current status — that is
 * presentation, not a precondition, and the server accepts any transition from any state.
 */
import { SpraySchedulesRowSchema } from "@mcmec/schemas/db/spray-schedules";
import z from "zod";
import { defineDomain } from "../command";

const website = defineDomain("website", "manage_website");
const command = website.table("spray_schedules");

/**
 * `mission_date` and `rain_date` are `date` columns in string mode — `dataType === "string"`,
 * so nothing downstream coerces them and this schema is the only place their format is decided
 * (#152). Postgres would accept a full ISO instant and truncate it, but then the column holds a
 * timestamp, which is what silently disarmed the notices retention check. Truncate here so the
 * column can only ever hold a date.
 */
const dateOnly = z.coerce.date().transform((d) => d.toISOString().slice(0, 10));

/**
 * The municipalities a mission covers — a full replace, so `[]` means "clears the set".
 *
 * Deduplicated because the junction's real key is the unique `(spray_schedule_id,
 * municipality_id)` pair; the bound is the one the retired endpoint already carried.
 */
const MunicipalityIds = z
	.array(z.uuid())
	.max(1000)
	.transform((ids) => [...new Set(ids)]);

const DetailFields = {
	area_description: SpraySchedulesRowSchema.shape.area_description,
	end_time: SpraySchedulesRowSchema.shape.end_time,
	insecticide_id: SpraySchedulesRowSchema.shape.insecticide_id,
	map_url: SpraySchedulesRowSchema.shape.map_url,
	mission_date: dateOnly,
	// Not a column of `spray_schedules`. See the module doc: it is the reason this command
	// exists as one command rather than two writes.
	municipality_ids: MunicipalityIds,
	rain_date: dateOnly.nullable(),
	start_time: SpraySchedulesRowSchema.shape.start_time,
} as const;

/** The lifecycle commands take no fields — the envelope id is the whole request. */
const EmptyPayload = z.object({});

export const createSprayMission = command(
	"createSprayMission",
	// No `status`: a mission is born scheduled, and every route out of that is a named
	// transition. The old form offered a status dropdown on the create screen, which meant a
	// mission could be created already cancelled.
	z.object(DetailFields),
	{ creates: true },
);

/**
 * Partial, because the collection handler sends `mutation.changes` — an area-only edit carries
 * one key. The non-empty refinement is what makes "an update that asks for nothing" a refusal.
 *
 * `municipality_ids` counts towards that: a save that changes nothing but the municipality set
 * is a real update, and it is the one case where the payload carries no column at all.
 */
export const updateSprayMissionDetails = command(
	"updateSprayMissionDetails",
	z
		.object(DetailFields)
		.partial()
		.refine((v) => Object.keys(v).length > 0, {
			error: "no fields to update",
		}),
);

export const cancelSprayMission = command("cancelSprayMission", EmptyPayload);
export const completeSprayMission = command(
	"completeSprayMission",
	EmptyPayload,
);
/**
 * A mission postponed by weather.
 *
 * #134 has this carrying `rain_date`, which #161 then settled differently for the same shape of
 * problem: a value the collection would only send when it changed cannot be relied on by the
 * command that reads it, so `cancelMeeting` takes no payload and reads the stored row. The same
 * answer applies here, and more cheaply — `rain_date` is an ordinary detail field with no rule
 * attached, so delaying needs nothing from the payload at all. Setting a rain date while
 * delaying is a Save-and-Delay: `updateSprayMissionDetails` then `delaySprayMission`, one
 * request, one transaction.
 */
export const delaySprayMission = command("delaySprayMission", EmptyPayload);
/** The route back to `scheduled` the status dropdown supplied and no command did (#157). */
export const rescheduleSprayMission = command(
	"rescheduleSprayMission",
	EmptyPayload,
);
export const deleteSprayMission = command("deleteSprayMission", EmptyPayload);

export const SPRAY_MISSION_COMMANDS = [
	createSprayMission,
	updateSprayMissionDetails,
	cancelSprayMission,
	completeSprayMission,
	delaySprayMission,
	rescheduleSprayMission,
	deleteSprayMission,
] as const;
