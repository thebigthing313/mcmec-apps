/**
 * `mosquito_activity_data` — one command, and the only one in the vocabulary that is not about
 * a row.
 *
 * A season of surveillance data arrives as a CSV. Importing it is *delete every row for the
 * years the file names, then insert the file* — idempotent by construction, so re-importing a
 * season swaps it cleanly and leaves every other year alone. There is no row to address, which
 * is why this is the vocabulary's one `targetless` command (#163): the envelope carries no
 * `id`, because there is nothing for one to point at.
 *
 * **The CSV is parsed in the browser, and that is deliberate.** The file is read by
 * `weekly-activity`'s Papa.parse, validated row by row against this schema's shape, and the
 * user is shown the row count, the years and the species groups *before* anything is sent. A
 * server-side parse would mean a multipart upload, which the dispatcher's flat-JSON envelope
 * cannot describe, and would move per-row error reporting ("row 214: week_number must be
 * 1..53") to a place that cannot point at the file the user picked. So the payload is the
 * parsed rows, and this command is the one whose payload is an array rather than a set of
 * fields.
 *
 * `z.coerce` on the numbers survives from the retired endpoint: a CSV cell is a string, and the
 * client parses to numbers before sending, so the coercion is belt-and-braces for a hand-rolled
 * caller rather than the normal path.
 *
 * The years wiped are *derived* from the rows, not declared. The guard against wiping the wrong
 * season is the preview and the "Confirm & Replace These Years" button, which is client-side
 * only — the server replaces whatever years the file names. Promoting that to a declared year
 * set the server checks the rows against would be new behaviour, and today it would refuse
 * nothing the preview does not already show, so #163 left it uninvented.
 */
import z from "zod";
import { defineDomain } from "../command";

const website = defineDomain("website", "manage_website");
const command = website.table("mosquito_activity_data");

/** Guardrail against an accidental huge upload; carried over from the retired endpoint. */
const MAX_ROWS = 20_000;

/**
 * One CSV row, named for its Postgres columns like every other payload on this wire.
 *
 * `week_number` mirrors the table's check constraint so a bad week is a 422 naming the row
 * rather than a constraint violation naming the statement. The bounds on the two measures are
 * the column's own: `int4` max, and `numeric(5, 2)`.
 */
const ImportRow = z.object({
	mosquito_count: z.coerce.number().int().min(0).max(2_147_483_647).default(0),
	rainfall_inches: z.coerce.number().min(0).max(999.99).default(0),
	species_group: z.string().min(1),
	species_name: z.string().min(1),
	week_number: z.coerce.number().int().min(1).max(53),
	year: z.coerce.number().int().min(1900).max(3000),
});

export const importMosquitoActivity = command(
	"importMosquitoActivity",
	z.object({ rows: z.array(ImportRow).min(1).max(MAX_ROWS) }),
	{ targetless: true },
);

export const MOSQUITO_ACTIVITY_COMMANDS = [importMosquitoActivity] as const;
