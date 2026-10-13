/**
 * An Insecticide's fact sheet (#220) is a column staff set from website-management, not a
 * trade name the public site matches against — so it has to survive the command round trip,
 * and be removable again.
 */
import { randomUUID } from "node:crypto";
import { insecticides as insecticideCommands } from "@mcmec/domain";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../db";
import { insecticides } from "../../db/schema";
import {
	postCommand,
	resetDatabase,
	sessionWithRoles,
	type TestSession,
} from "../../test/helpers";

const FACT_SHEET = "https://example.com/fact-sheet.pdf";

let website: TestSession;

beforeEach(async () => {
	website = await sessionWithRoles(["manage_website"]);
});

afterEach(resetDatabase);

function createEnvelope(extra: Record<string, unknown> = {}) {
	return {
		active_ingredient: "Etofenprox",
		active_ingredient_url: "https://example.com/etofenprox",
		fact_sheet_url: null,
		id: randomUUID(),
		intents: [insecticideCommands.createInsecticide.name],
		label_url: "https://example.com/label.pdf",
		msds_url: "https://example.com/sds.pdf",
		trade_name: "Zenivex E20",
		type_name: "Adulticide",
		...extra,
	};
}

async function storedFactSheet(id: string) {
	const [row] = await db
		.select({ factSheetUrl: insecticides.factSheetUrl })
		.from(insecticides)
		.where(eq(insecticides.id, id));
	return row?.factSheetUrl;
}

describe("an insecticide's fact sheet", () => {
	it("is stored by the create", async () => {
		const envelope = createEnvelope({ fact_sheet_url: FACT_SHEET });

		const res = await postCommand(envelope, website);

		expect(res.status).toBe(201);
		expect(await storedFactSheet(envelope.id)).toBe(FACT_SHEET);
	});

	it("may be left off an insecticide", async () => {
		const envelope = createEnvelope();

		const res = await postCommand(envelope, website);

		expect(res.status).toBe(201);
		expect(await storedFactSheet(envelope.id)).toBeNull();
	});

	it("can be added and removed by an update", async () => {
		const envelope = createEnvelope();
		await postCommand(envelope, website);
		const update = (fact_sheet_url: string | null) =>
			postCommand(
				{
					fact_sheet_url,
					id: envelope.id,
					intents: [insecticideCommands.updateInsecticideDetails.name],
				},
				website,
			);

		expect((await update(FACT_SHEET)).status).toBe(200);
		expect(await storedFactSheet(envelope.id)).toBe(FACT_SHEET);

		expect((await update(null)).status).toBe(200);
		expect(await storedFactSheet(envelope.id)).toBeNull();
	});

	it("must be a URL", async () => {
		const res = await postCommand(
			createEnvelope({ fact_sheet_url: "fact sheet" }),
			website,
		);

		expect(res.status).toBe(422);
	});
});
