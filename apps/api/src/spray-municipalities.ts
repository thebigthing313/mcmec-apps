// Spray-schedule ↔ municipality junction — PUT /api/spray-schedules/:id/municipalities
// (gated by manage_website).
//
// The junction has a composite PK and no surrogate id, so it can't go through the generic
// /api/data CRUD. This replaces the full municipality set for one schedule (delete-all + insert)
// in a transaction. An unknown municipality id surfaces as a 400 via the FK violation.

import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { z } from "zod";
import { setActor } from "./actor";
import { db } from "./db";
import { sprayScheduleMunicipalities, spraySchedules } from "./db/schema";
import { requirePermission } from "./session";

const bodySchema = z.object({
	// full replace; [] clears every municipality for the schedule
	municipalityIds: z
		.array(z.uuid())
		.max(1000)
		.transform((ids) => [...new Set(ids)]),
});

// Postgres foreign_key_violation — a municipalityId that doesn't exist.
function isFkViolation(e: unknown): boolean {
	return (
		typeof e === "object" &&
		e !== null &&
		"code" in e &&
		(e as { code?: string }).code === "23503"
	);
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
		});
	} catch (e) {
		if (isFkViolation(e)) {
			return c.json({ error: "unknown municipality id" }, 400);
		}
		throw e;
	}

	return c.json({ success: true, sprayScheduleId: id, municipalityIds });
}
