// Spray-schedule ↔ municipality junction — GET /api/spray-schedules/municipalities and
// PUT /api/spray-schedules/:id/municipalities (both gated by manage_website).
//
// The junction has a composite PK and no surrogate id, so it can't go through the generic
// /api/data CRUD — and for the same reason it can't be a TanStack DB collection (those key on
// `id`), hence the plain GET below instead of an Electric shape. The PUT replaces the full
// municipality set for one schedule (delete-all + insert) in a transaction. An unknown
// municipality id surfaces as a 422 via the FK violation.

import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { z } from "zod";
import { getTxid, setActor } from "./actor";
import { db } from "./db";
import { sprayScheduleMunicipalities, spraySchedules } from "./db/schema";
import { pgErrorResponse } from "./db-errors";
import { requirePermission } from "./session";

const bodySchema = z.object({
	// full replace; [] clears every municipality for the schedule
	municipalityIds: z
		.array(z.uuid())
		.max(1000)
		.transform((ids) => [...new Set(ids)]),
});

/** Every junction row, for the management UI to group client-side. */
export async function listSprayScheduleMunicipalities(
	c: Context,
): Promise<Response> {
	const session = await requirePermission(c, "manage_website");
	if (session instanceof Response) return session;

	const rows = await db
		.select({
			sprayScheduleId: sprayScheduleMunicipalities.sprayScheduleId,
			municipalityId: sprayScheduleMunicipalities.municipalityId,
		})
		.from(sprayScheduleMunicipalities);

	return c.json({ rows });
}

export async function setSprayScheduleMunicipalities(
	c: Context,
): Promise<Response> {
	const session = await requirePermission(c, "manage_website");
	if (session instanceof Response) return session;

	const id = c.req.param("id");
	if (!id) return c.json({ error: "missing id" }, 400);

	const parsed = bodySchema.safeParse(await c.req.json().catch(() => null));
	if (!parsed.success) {
		return c.json({ error: "invalid", issues: parsed.error.issues }, 422);
	}
	const { municipalityIds } = parsed.data;

	const [schedule] = await db
		.select({ id: spraySchedules.id })
		.from(spraySchedules)
		.where(eq(spraySchedules.id, id))
		.limit(1);
	if (!schedule) return c.json({ error: "spray schedule not found" }, 404);

	const actor = setActor(session, c);
	let txid = "";
	try {
		await db.transaction(async (tx) => {
			await actor(tx);
			await tx
				.delete(sprayScheduleMunicipalities)
				.where(eq(sprayScheduleMunicipalities.sprayScheduleId, id));
			if (municipalityIds.length) {
				await tx.insert(sprayScheduleMunicipalities).values(
					municipalityIds.map((municipalityId) => ({
						sprayScheduleId: id,
						municipalityId,
					})),
				);
			}
			txid = await getTxid(tx);
		});
	} catch (e) {
		// an unknown municipality id surfaces as a FK violation
		const res = pgErrorResponse(c, e, 422);
		if (res) return res;
		throw e;
	}

	return c.json({ success: true, sprayScheduleId: id, municipalityIds, txid });
}
