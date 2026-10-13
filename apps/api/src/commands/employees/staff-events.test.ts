/**
 * Staff Events (#304): HR announces them under `manage_employees`, every signed-in Employee reads
 * them on the Calendar, and `is_cancelled` moves only through the two lifecycle commands.
 */
import { randomUUID } from "node:crypto";
import { staffEvents as staffEventCommands } from "@mcmec/domain";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../db";
import { staffEvents } from "../../db/schema";
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
		description: "Hosted by the State Mosquito Control Commission.",
		end_time: "15:00",
		ends_on: null,
		id: randomUUID(),
		intents: [staffEventCommands.createStaffEvent.name],
		location: null,
		start_time: "13:00",
		starts_on: "2026-10-21",
		title: "Recertification webinar",
		url: "https://example.com/register",
		...extra,
	};
}

async function stored(id: string) {
	const [row] = await db
		.select()
		.from(staffEvents)
		.where(eq(staffEvents.id, id));
	return row;
}

async function created(extra: Record<string, unknown> = {}) {
	const envelope = createEnvelope(extra);
	const res = await postCommand(envelope, hr);
	expect(res.status).toBe(201);
	return envelope.id;
}

const send = (
	id: string,
	intents: string[],
	fields: Record<string, unknown> = {},
) => postCommand({ id, intents, ...fields }, hr);

describe("a Staff Event's commands", () => {
	it("creates an uncancelled event under the envelope id", async () => {
		const id = await created();

		expect(await stored(id)).toMatchObject({
			endTime: "15:00:00",
			endsOn: null,
			isCancelled: false,
			startTime: "13:00:00",
			startsOn: "2026-10-21",
			title: "Recertification webinar",
		});
	});

	it("creates an all-day, multi-day event", async () => {
		const id = await created({
			end_time: null,
			ends_on: "2026-10-23",
			start_time: null,
		});

		expect(await stored(id)).toMatchObject({
			endTime: null,
			endsOn: "2026-10-23",
			startTime: null,
		});
	});

	it("updates the details, and bumps updated_at", async () => {
		const id = await created();
		const before = await stored(id);

		const res = await send(
			id,
			[staffEventCommands.updateStaffEventDetails.name],
			{ location: "Main office", title: "Recertification (Part 1)" },
		);

		expect(res.status).toBe(200);
		const after = await stored(id);
		expect(after).toMatchObject({
			location: "Main office",
			title: "Recertification (Part 1)",
		});
		expect(after?.updatedAt.getTime()).toBeGreaterThan(
			before?.updatedAt.getTime() ?? Number.POSITIVE_INFINITY,
		);
	});

	it("never moves is_cancelled through an update", async () => {
		const id = await created();

		const res = await send(
			id,
			[staffEventCommands.updateStaffEventDetails.name],
			{ is_cancelled: true, title: "Still on" },
		);

		expect(res.status).toBe(200);
		expect(await stored(id)).toMatchObject({
			isCancelled: false,
			title: "Still on",
		});
	});

	it("cancels and reinstates an event already past", async () => {
		const id = await created({ starts_on: "2020-03-10" });

		expect(
			(await send(id, [staffEventCommands.cancelStaffEvent.name])).status,
		).toBe(200);
		expect((await stored(id))?.isCancelled).toBe(true);

		expect(
			(await send(id, [staffEventCommands.uncancelStaffEvent.name])).status,
		).toBe(200);
		expect((await stored(id))?.isCancelled).toBe(false);
	});

	it("saves and cancels in one request", async () => {
		const id = await created();

		const res = await send(
			id,
			[
				staffEventCommands.updateStaffEventDetails.name,
				staffEventCommands.cancelStaffEvent.name,
			],
			{ description: "Called off: the presenter is ill." },
		);

		expect(res.status).toBe(200);
		expect(await stored(id)).toMatchObject({
			description: "Called off: the presenter is ill.",
			isCancelled: true,
		});
	});

	it("deletes an event entered by mistake", async () => {
		const id = await created();

		const res = await send(id, [staffEventCommands.deleteStaffEvent.name]);

		expect(res.status).toBe(200);
		expect(await stored(id)).toBeUndefined();
	});

	it("is refused to a caller who manages only the website", async () => {
		const website = await sessionWithRoles(["manage_website"]);

		const res = await postCommand(createEnvelope(), website);

		expect(res.status).toBe(403);
	});
});

describe("the date and time rules", () => {
	// On a create every field is present, so the payload itself refuses.
	it.each([
		["an end date before the start date", { ends_on: "2026-10-20" }],
		["an end time with no start time", { start_time: null }],
		["a single day that ends before it starts", { end_time: "12:00" }],
	])("refuse a create with %s", async (_label, fields) => {
		const res = await postCommand(createEnvelope(fields), hr);

		expect(res.status).toBe(422);
	});

	// A partial update can carry half a pair, which the payload cannot judge — the table's check
	// constraints are the backstop, and each refuses its row.
	it("refuse moving the end date before the start", async () => {
		const id = await created({ ends_on: "2026-10-22" });

		const res = await send(
			id,
			[staffEventCommands.updateStaffEventDetails.name],
			{ ends_on: "2026-10-20" },
		);

		expect(res.status).toBe(422);
		expect((await stored(id))?.endsOn).toBe("2026-10-22");
	});

	it("refuse an end time on an all-day event", async () => {
		const id = await created({ end_time: null, start_time: null });

		const res = await send(
			id,
			[staffEventCommands.updateStaffEventDetails.name],
			{ end_time: "15:00" },
		);

		expect(res.status).toBe(422);
	});

	it("refuse a single-day end time before its start", async () => {
		const id = await created();

		const res = await send(
			id,
			[staffEventCommands.updateStaffEventDetails.name],
			{ end_time: "12:00" },
		);

		expect(res.status).toBe(422);
		expect((await stored(id))?.endTime).toBe("15:00:00");
	});
});

describe("the staff_events shape", () => {
	it("is refused to an anonymous caller", async () => {
		const { status, forwarded } = await requestShape("staff_events");

		expect(status).toBe(401);
		expect(forwarded).toBeNull();
	});

	it("is served whole to an Employee with no App Role", async () => {
		const employee = await sessionWithRoles([]);

		const { status, forwarded } = await requestShape("staff_events", employee);

		expect(status).toBe(200);
		expect(forwarded?.searchParams.get("table")).toBe("staff_events");
		expect(forwarded?.searchParams.has("where")).toBe(false);
	});
});
