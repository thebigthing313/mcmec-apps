/**
 * The command boundary (#184).
 *
 * Every write in the system travels as a named command through `POST /api/commands`, and the
 * route enforces a handful of runtime invariants that no build step can. This file drives that
 * route through the real Hono app — routing, envelope parsing, the permission gate, the
 * dispatcher and the handlers all run — and asserts the status **and** the refusal the caller
 * reads back. The reason strings are user-visible (the server's own sentence is what the UI
 * shows), so changing one is a behavioural change and should fail here.
 *
 * Envelopes name commands through the exported definitions rather than through string
 * literals, so a renamed command breaks this file's build instead of silently skipping a test.
 *
 * Deliberately not covered: the per-command audit GUC. The mutation-logging trigger is attached
 * to `employees` and `users` only, and no multi-intent call site writes either, so "two intents
 * produce two audit rows naming two commands" cannot fire yet.
 */
import { randomUUID } from "node:crypto";
import {
	employees as employeeCommands,
	mosquitoActivity as mosquitoCommands,
	notices as noticeCommands,
	publicRequests as publicRequestCommands,
} from "@mcmec/domain";
import { eq, sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../db";
import { notices } from "../db/schema";
import {
	postCommand,
	resetDatabase,
	SOME_CONTENT,
	seedNotice,
	seedNoticeType,
	sessionWithRoles,
	type TestSession,
} from "../test/helpers";

const WEBSITE = noticeCommands.publishNotice.permission;
const EMPLOYEES = employeeCommands.updateEmployeeDetails.permission;

let website: TestSession;
let noticeTypeId: string;

beforeEach(async () => {
	website = await sessionWithRoles([WEBSITE]);
	noticeTypeId = await seedNoticeType();
});

afterEach(resetDatabase);

/** A well-formed `createNotice` envelope, so a test can vary one thing about it. */
function createNoticeEnvelope(extra: Record<string, unknown> = {}) {
	return {
		content: SOME_CONTENT,
		id: randomUUID(),
		intents: [noticeCommands.createNotice.name],
		is_published: false,
		notice_date: "2020-01-01",
		notice_type_id: noticeTypeId,
		title: "A brand new notice",
		...extra,
	};
}

async function storedNotice(id: string) {
	const [row] = await db.select().from(notices).where(eq(notices.id, id));
	return row;
}

describe("unknown commands", () => {
	it("refuses an intent the vocabulary does not have", async () => {
		const res = await postCommand(
			{ id: randomUUID(), intents: ["website.burnItAllDown"] },
			website,
		);

		expect(res.status).toBe(400);
		expect(res.body.error).toBe("unknown_command");
		expect(res.body.reason).toBe("no such command: website.burnItAllDown");
	});

	it("refuses a real but public command, which has its own route", async () => {
		const name = publicRequestCommands.submitPublicRequest.name;

		const res = await postCommand(
			{ id: randomUUID(), intents: [name] },
			website,
		);

		expect(res.status).toBe(400);
		expect(res.body.error).toBe("unknown_command");
		expect(res.body.reason).toBe(
			`${name} is public and is served from its own route`,
		);
	});
});

describe("envelope shape", () => {
	const badIntents = [
		["missing", { id: randomUUID() }],
		["empty", { id: randomUUID(), intents: [] }],
		["not an array", { id: randomUUID(), intents: "website.publishNotice" }],
		["not strings", { id: randomUUID(), intents: [{ name: "publish" }] }],
	] as const;

	for (const [what, envelope] of badIntents) {
		it(`refuses intents that are ${what}`, async () => {
			const res = await postCommand(envelope, website);

			expect(res.status).toBe(400);
			expect(res.body.error).toBe("malformed_envelope");
			expect(res.body.reason).toBe(
				"intents must be a non-empty array of command names",
			);
		});
	}

	it("refuses a body that is not an object", async () => {
		const res = await postCommand(["website.publishNotice"], website);

		expect(res.status).toBe(400);
		expect(res.body.error).toBe("malformed_envelope");
		expect(res.body.reason).toBe("body must be an object");
	});

	it("refuses a duplicated intent", async () => {
		const name = noticeCommands.publishNotice.name;

		const res = await postCommand(
			{ id: randomUUID(), intents: [name, name] },
			website,
		);

		expect(res.status).toBe(400);
		expect(res.body.error).toBe("malformed_envelope");
		expect(res.body.reason).toBe("intents contains a duplicate");
	});

	it("refuses a row-scoped command with no target id", async () => {
		const res = await postCommand(
			{ intents: [noticeCommands.publishNotice.name] },
			website,
		);

		expect(res.status).toBe(400);
		expect(res.body.error).toBe("malformed_envelope");
		expect(res.body.reason).toBe("id must be a non-empty string");
	});
});

describe("payload refinements", () => {
	it("refuses an update that asks for nothing", async () => {
		const id = await seedNotice({ daysAgo: 30, noticeTypeId });

		const res = await postCommand(
			{ id, intents: [noticeCommands.updateNoticeDetails.name] },
			website,
		);

		expect(res.status).toBe(422);
		expect(res.body.error).toBe("invalid");
		expect(JSON.stringify(res.body.issues)).toContain("no fields to update");
	});
});

describe("permission", () => {
	it("refuses an anonymous caller", async () => {
		const res = await postCommand({
			id: randomUUID(),
			intents: [noticeCommands.publishNotice.name],
		});

		expect(res.status).toBe(401);
		expect(res.body.error).toBe("unauthenticated");
	});

	/**
	 * The ordering is the point. This envelope would fail the payload refinement too, and the
	 * caller must never learn that: a permission they do not hold is checked first, so no
	 * builder runs and no payload is inspected.
	 */
	it("is checked before the payload, so a forbidden caller gets 403 not 422", async () => {
		const nobody = await sessionWithRoles([]);
		const id = await seedNotice({ daysAgo: 30, noticeTypeId });

		const res = await postCommand(
			{ id, intents: [noticeCommands.updateNoticeDetails.name] },
			nobody,
		);

		expect(res.status).toBe(403);
		expect(res.body.error).toBe("forbidden");
	});

	it("requires every permission the envelope's commands name", async () => {
		const id = await seedNotice({ daysAgo: 30, noticeTypeId });
		const envelope = {
			display_name: "Renamed",
			id,
			intents: [
				noticeCommands.publishNotice.name,
				employeeCommands.updateEmployeeDetails.name,
			],
		};

		const websiteOnly = await postCommand(envelope, website);
		expect(websiteOnly.status).toBe(403);
		expect(websiteOnly.body.error).toBe("forbidden");

		// Holding both gets past the gate — the 404 is the employees handler failing to find
		// the row, which is proof the gate let it through rather than a second refusal.
		const both = await sessionWithRoles([WEBSITE, EMPLOYEES]);
		const withBoth = await postCommand(envelope, both);
		expect(withBoth.status).toBe(404);
	});
});

describe("domain preconditions", () => {
	it("refuses to archive a notice inside its seven-day retention period", async () => {
		const id = await seedNotice({ daysAgo: 2, noticeTypeId });

		const res = await postCommand(
			{ id, intents: [noticeCommands.archiveNotice.name] },
			website,
		);

		expect(res.status).toBe(409);
		expect(res.body.error).toBe("precondition_failed");
		expect(res.body.reason).toBe("retention_period");
	});

	it("archives a notice once the retention period has passed", async () => {
		const id = await seedNotice({ daysAgo: 30, noticeTypeId });

		const res = await postCommand(
			{ id, intents: [noticeCommands.archiveNotice.name] },
			website,
		);

		expect(res.status).toBe(200);
		expect((await storedNotice(id))?.isArchived).toBe(true);
	});

	it("refuses distinctly when the notice date cannot be read", async () => {
		const id = await seedNotice({ daysAgo: 30, noticeTypeId });
		// `infinity` is a legal `date` value that no `Date` can parse — the stored state the
		// handler's NaN guard exists for, and the one the naive comparison would wave through.
		await db.execute(
			sql`update notices set notice_date = 'infinity' where id = ${id}`,
		);

		const res = await postCommand(
			{ id, intents: [noticeCommands.archiveNotice.name] },
			website,
		);

		expect(res.status).toBe(409);
		expect(res.body.error).toBe("precondition_failed");
		expect(res.body.reason).toBe("unreadable_notice_date");
	});
});

describe("targetless isolation", () => {
	const importRows = {
		rows: [
			{
				mosquito_count: 3,
				rainfall_inches: 0.5,
				species_group: "Culex",
				species_name: "Culex pipiens",
				week_number: 22,
				year: 2024,
			},
		],
	};

	it("refuses a targetless command sharing an envelope with a row-scoped one", async () => {
		const id = await seedNotice({ daysAgo: 30, noticeTypeId });
		const name = mosquitoCommands.importMosquitoActivity.name;

		const res = await postCommand(
			{
				...importRows,
				id,
				intents: [name, noticeCommands.publishNotice.name],
			},
			website,
		);

		expect(res.status).toBe(400);
		expect(res.body.error).toBe("malformed_envelope");
		expect(res.body.reason).toBe(
			`${name} is not about a row and must be sent alone`,
		);
	});

	it("accepts a targetless command sent alone and with no id", async () => {
		const res = await postCommand(
			{
				...importRows,
				intents: [mosquitoCommands.importMosquitoActivity.name],
			},
			website,
		);

		expect(res.status).toBe(200);
	});
});

describe("two-intent atomicity", () => {
	/**
	 * The save-and-publish shape, refused at its second intent. The client relies on both
	 * effects committing or neither, so the assertion is about the stored row — an error
	 * response with the edit already written would look identical here otherwise.
	 */
	it("rolls the field update back when the lifecycle command refuses", async () => {
		const id = await seedNotice({
			daysAgo: 1,
			noticeTypeId,
			title: "The original title",
		});

		const res = await postCommand(
			{
				id,
				intents: [
					noticeCommands.updateNoticeDetails.name,
					noticeCommands.archiveNotice.name,
				],
				title: "An edited title",
			},
			website,
		);

		expect(res.status).toBe(409);
		expect(res.body.reason).toBe("retention_period");
		expect((await storedNotice(id))?.title).toBe("The original title");
		expect((await storedNotice(id))?.isArchived).toBe(false);
	});

	it("commits both effects when neither refuses", async () => {
		const id = await seedNotice({
			daysAgo: 30,
			noticeTypeId,
			title: "The original title",
		});

		const res = await postCommand(
			{
				id,
				intents: [
					noticeCommands.updateNoticeDetails.name,
					noticeCommands.publishNotice.name,
				],
				title: "An edited title",
			},
			website,
		);

		expect(res.status).toBe(200);
		const row = await storedNotice(id);
		expect(row?.title).toBe("An edited title");
		expect(row?.isPublished).toBe(true);
	});
});

describe("the response contract", () => {
	it("returns a txid and nothing else", async () => {
		const id = await seedNotice({ daysAgo: 30, noticeTypeId });

		const res = await postCommand(
			{ id, intents: [noticeCommands.publishNotice.name] },
			website,
		);

		expect(res.status).toBe(200);
		expect(Object.keys(res.body)).toEqual(["txid"]);
		expect(res.body.txid).toMatch(/^\d+$/);
	});

	it("answers 201 when the envelope contained a create", async () => {
		const res = await postCommand(createNoticeEnvelope(), website);

		expect(res.status).toBe(201);
		expect(Object.keys(res.body)).toEqual(["txid"]);
	});
});

describe("server-owned values", () => {
	it("ignores columns the client has no command for", async () => {
		const envelope = createNoticeEnvelope({
			created_at: "1999-01-01T00:00:00.000Z",
			// `is_archived` is off every notices payload on purpose: a notice is born active
			// and only `archiveNotice` may move it.
			is_archived: true,
		});

		const res = await postCommand(envelope, website);

		expect(res.status).toBe(201);
		const row = await storedNotice(envelope.id);
		expect(row?.isArchived).toBe(false);
		expect(row?.createdAt.getFullYear()).toBe(new Date().getFullYear());
	});
});
