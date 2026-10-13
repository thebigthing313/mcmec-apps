/**
 * Holidays (#303): HR adopts them under `manage_employees`, and every signed-in Employee reads
 * them on the Calendar. The one rule that needs the database is that a day closes only once.
 */
import { randomUUID } from "node:crypto";
import { holidays as holidayCommands } from "@mcmec/domain";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../db";
import { holidays } from "../../db/schema";
import {
	postCommand,
	requestShape,
	resetDatabase,
	sessionWithRoles,
	type TestSession,
} from "../../test/helpers";

let hr: TestSession;

beforeEach(async () => {
	hr = await sessionWithRoles(["manage_employees"]);
});

afterEach(resetDatabase);

function createEnvelope(extra: Record<string, unknown> = {}) {
	return {
		falls_on: "2026-07-04",
		id: randomUUID(),
		intents: [holidayCommands.createHoliday.name],
		name: "Independence Day",
		observed_on: "2026-07-03",
		...extra,
	};
}

async function stored(id: string) {
	const [row] = await db.select().from(holidays).where(eq(holidays.id, id));
	return row;
}

describe("a Holiday's commands", () => {
	it("creates a Holiday under the envelope id, with its dates as given", async () => {
		const envelope = createEnvelope();

		const res = await postCommand(envelope, hr);

		expect(res.status).toBe(201);
		expect(await stored(envelope.id)).toMatchObject({
			fallsOn: "2026-07-04",
			name: "Independence Day",
			observedOn: "2026-07-03",
		});
	});

	it("updates a Holiday, and can clear its falls-on date", async () => {
		const envelope = createEnvelope();
		await postCommand(envelope, hr);
		const before = await stored(envelope.id);

		const res = await postCommand(
			{
				falls_on: null,
				id: envelope.id,
				intents: [holidayCommands.updateHoliday.name],
				name: "Independence Day (observed)",
			},
			hr,
		);

		expect(res.status).toBe(200);
		const after = await stored(envelope.id);
		expect(after).toMatchObject({
			fallsOn: null,
			name: "Independence Day (observed)",
			observedOn: "2026-07-03",
		});
		// The `set_updated_at` trigger is attached by a migration, not only by triggers.sql.
		expect(after?.updatedAt.getTime()).toBeGreaterThan(
			before?.updatedAt.getTime() ?? Number.POSITIVE_INFINITY,
		);
	});

	it("deletes a Holiday", async () => {
		const envelope = createEnvelope();
		await postCommand(envelope, hr);

		const res = await postCommand(
			{ id: envelope.id, intents: [holidayCommands.deleteHoliday.name] },
			hr,
		);

		expect(res.status).toBe(200);
		expect(await stored(envelope.id)).toBeUndefined();
	});

	it("refuses an update that asks for nothing", async () => {
		const envelope = createEnvelope();
		await postCommand(envelope, hr);

		const res = await postCommand(
			{ id: envelope.id, intents: [holidayCommands.updateHoliday.name] },
			hr,
		);

		expect(res.status).toBe(422);
	});

	it("refuses a date that is not a day", async () => {
		const res = await postCommand(
			createEnvelope({ observed_on: "2026-07-03T00:00:00Z" }),
			hr,
		);

		expect(res.status).toBe(422);
	});

	it("is refused to a caller who manages only the website", async () => {
		const website = await sessionWithRoles(["manage_website"]);

		const res = await postCommand(createEnvelope(), website);

		expect(res.status).toBe(403);
	});
});

describe("a day already closed", () => {
	it("refuses a second Holiday on it", async () => {
		await postCommand(createEnvelope(), hr);

		const res = await postCommand(
			createEnvelope({ falls_on: null, name: "Something else" }),
			hr,
		);

		expect(res.status).toBe(409);
		expect(res.body).toMatchObject({
			error: "conflict",
			message: "There is already a Holiday on Fri, Jul 3, 2026.",
			reason: "holiday_date_taken",
		});
	});

	it("refuses moving another Holiday onto it", async () => {
		await postCommand(createEnvelope(), hr);
		const labor = createEnvelope({
			falls_on: null,
			name: "Labor Day",
			observed_on: "2026-09-07",
		});
		await postCommand(labor, hr);

		const res = await postCommand(
			{
				id: labor.id,
				intents: [holidayCommands.updateHoliday.name],
				observed_on: "2026-07-03",
			},
			hr,
		);

		expect(res.status).toBe(409);
		expect(res.body.reason).toBe("holiday_date_taken");
		expect((await stored(labor.id))?.observedOn).toBe("2026-09-07");
	});
});

describe("the holidays shape", () => {
	it("is refused to an anonymous caller", async () => {
		const { status, forwarded } = await requestShape("holidays");

		expect(status).toBe(401);
		expect(forwarded).toBeNull();
	});

	it("is served whole to an Employee with no App Role", async () => {
		const employee = await sessionWithRoles([]);

		const { status, forwarded } = await requestShape("holidays", employee);

		expect(status).toBe(200);
		expect(forwarded?.searchParams.get("table")).toBe("holidays");
		expect(forwarded?.searchParams.has("where")).toBe(false);
	});
});
