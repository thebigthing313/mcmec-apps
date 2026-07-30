// Mosquito surveillance bulk import — POST /api/mosquito-activity/import (manage_website).
//
// CSV-origin dataset upload. Replaces every row for the year(s) present in the payload
// (delete-by-year + chunked insert) in a single transaction, so a re-import of a season is
// idempotent and never leaves half a season behind. Other years are untouched.

import { inArray } from "drizzle-orm";
import type { Context } from "hono";
import { z } from "zod";
import { setActor } from "./actor";
import { db } from "./db";
import { mosquitoActivityData } from "./db/schema";
import { pgErrorResponse } from "./db-errors";
import { requirePermission } from "./session";

const MAX_ROWS = 20_000; // guardrail against an accidental huge upload
const CHUNK = 500; // rows per insert statement

// z.coerce tolerates string cells from a parsed CSV; week_number mirrors the DB check (1..53).
const importRow = z.object({
	speciesName: z.string().min(1),
	speciesGroup: z.string().min(1),
	year: z.coerce.number().int().min(1900).max(3000),
	weekNumber: z.coerce.number().int().min(1).max(53),
	mosquitoCount: z.coerce.number().int().min(0).max(2_147_483_647).default(0), // int4 max
	rainfallInches: z.coerce.number().min(0).max(999.99).default(0), // numeric(5,2)
});

const importSchema = z.object({
	rows: z.array(importRow).min(1).max(MAX_ROWS),
});

export async function importMosquitoActivity(c: Context): Promise<Response> {
	const session = await requirePermission(c, "manage_website");
	if (session instanceof Response) return session;

	const parsed = importSchema.safeParse(await c.req.json().catch(() => null));
	if (!parsed.success) {
		return c.json({ error: "invalid", issues: parsed.error.issues }, 422);
	}
	const { rows } = parsed.data;
	const years = [...new Set(rows.map((r) => r.year))];

	// numeric(5,2) column takes a string; freeze scale to 2.
	const values = rows.map((r) => ({
		speciesName: r.speciesName,
		speciesGroup: r.speciesGroup,
		year: r.year,
		weekNumber: r.weekNumber,
		mosquitoCount: r.mosquitoCount,
		rainfallInches: r.rainfallInches.toFixed(2),
	}));

	const actor = setActor(session, c);
	try {
		await db.transaction(async (tx) => {
			await actor(tx);
			await tx
				.delete(mosquitoActivityData)
				.where(inArray(mosquitoActivityData.year, years));
			for (let i = 0; i < values.length; i += CHUNK) {
				await tx
					.insert(mosquitoActivityData)
					.values(values.slice(i, i + CHUNK));
			}
		});
	} catch (e) {
		const res = pgErrorResponse(c, e, 422);
		if (res) return res;
		throw e;
	}

	return c.json({
		success: true,
		inserted: values.length,
		replacedYears: years,
	});
}
