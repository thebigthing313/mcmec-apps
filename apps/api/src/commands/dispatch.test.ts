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
import { asc, eq, sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../db";
import { noticePostings, notices } from "../db/schema";
import {
	MINIMAL_TIPTAP_DOC,
	postCommand,
	resetDatabase,
	seedNotice,
	seedNoticeType,
	sessionWithRoles,
	type TestSession,
} from "../test/helpers";

const MANAGE_WEBSITE = "manage_website";
const MANAGE_EMPLOYEES = "manage_employees";

let website: TestSession;
let noticeTypeId: string;

beforeEach(async () => {
	website = await sessionWithRoles([MANAGE_WEBSITE]);
	noticeTypeId = await seedNoticeType();
});

afterEach(resetDatabase);

/** A well-formed `createNotice` envelope, so a test can vary one thing about it. */
function createNoticeEnvelope(extra: Record<string, unknown> = {}) {
	return {
		content: MINIMAL_TIPTAP_DOC,
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

async function postingsFor(noticeId: string) {
	return db
		.select()
		.from(noticePostings)
		.where(eq(noticePostings.noticeId, noticeId))
		.orderBy(asc(noticePostings.postedAt));
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

	/**
	 * "Before any builder runs" is only observable when a builder would also have refused. This
	 * envelope has no `id` and no fields for `updateNoticeDetails`, so it would fail the target
	 * check and the payload refinement too — and the caller must still be told the thing that
	 * matters, which is that one of their commands does not exist.
	 */
	it("refuses the unknown name ahead of the envelope and payload checks", async () => {
		const res = await postCommand(
			{
				intents: [
					"website.burnItAllDown",
					noticeCommands.updateNoticeDetails.name,
				],
			},
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
	/**
	 * The one refusal with no `reason`: a Zod failure carries `issues`, which is what names the
	 * refinement that fired. Asserting the sentence rather than merely the 422 keeps this
	 * pinned to the refinement and not to any other way the payload could fail.
	 */
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

		// Holding both gets past the gate. The refusal that follows is the employees handler
		// failing to find its row — a different refusal, from past the gate, rather than a
		// second 403.
		const both = await sessionWithRoles([MANAGE_WEBSITE, MANAGE_EMPLOYEES]);
		const withBoth = await postCommand(envelope, both);
		expect(withBoth.status).toBe(404);
		expect(withBoth.body.error).toBe("not found");
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
		const row = await storedNotice(id);
		expect(row?.title).toBe("The original title");
		expect(row?.isArchived).toBe(false);
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

/**
 * The proof-of-posting ledger (#111).
 *
 * `notice_postings` is append-only and excluded from the audit purge, because under
 * P.L. 2025 c.72 what was published and when is legal evidence. It is written inside the
 * command's transaction rather than after it, which is what these tests are really about: a
 * refused envelope must leave no posting behind.
 */
describe("the proof-of-posting ledger", () => {
	async function publish(id: string, session = website) {
		return postCommand(
			{ id, intents: [noticeCommands.publishNotice.name] },
			session,
		);
	}

	it("appends one row on a publish transition, attributed to the caller", async () => {
		const id = await seedNotice({ daysAgo: 30, noticeTypeId, title: "Notice" });

		expect((await publish(id)).status).toBe(200);

		const postings = await postingsFor(id);
		expect(postings).toHaveLength(1);
		expect(postings[0]?.postedBy).toBe(website.userId);
		expect(postings[0]?.snapshot).toMatchObject({ title: "Notice" });
	});

	it("appends nothing when the notice was already published", async () => {
		const id = await seedNotice({ daysAgo: 30, noticeTypeId });
		await publish(id);

		expect((await publish(id)).status).toBe(200);

		expect(await postingsFor(id)).toHaveLength(1);
	});

	it("appends a second row when a notice is unpublished and republished", async () => {
		const id = await seedNotice({ daysAgo: 30, noticeTypeId });
		await publish(id);
		await postCommand(
			{ id, intents: [noticeCommands.unpublishNotice.name] },
			website,
		);

		await publish(id);

		// Two distinct periods of public availability, and both are evidence.
		expect(await postingsFor(id)).toHaveLength(2);
	});

	/**
	 * The ledger belongs to the write that caused it. `publishNotice` appends before
	 * `archiveNotice` refuses, and the refusal has to take the posting with it — otherwise the
	 * append-only table holds a record of a publication that never happened, and nothing can
	 * remove it.
	 */
	it("rolls the posting back when a later intent refuses", async () => {
		const id = await seedNotice({ daysAgo: 1, noticeTypeId });

		const res = await postCommand(
			{
				id,
				intents: [
					noticeCommands.publishNotice.name,
					noticeCommands.archiveNotice.name,
				],
			},
			website,
		);

		expect(res.status).toBe(409);
		expect(res.body.reason).toBe("retention_period");
		expect(await postingsFor(id)).toHaveLength(0);
		expect((await storedNotice(id))?.isPublished).toBe(false);
	});

	/**
	 * Not covered: the `for update` row lock on the transition check.
	 *
	 * Two `publishNotice` requests fired with `Promise.all` do not actually overlap here — they
	 * complete in sequence against the pool, so the test passes with the lock removed and would
	 * only ever be false confidence. Making them overlap needs the two transactions held open
	 * and stepped past each other, which the real request path gives no way to do; #184 asked
	 * for that to be said out loud rather than papered over with a test-only seam.
	 */
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
	/**
	 * The strong form: the stored value is one the server chose and is *not* the column
	 * default, so the assertion cannot pass merely because nothing was written.
	 *
	 * `is_published` is off `updateNoticeDetails`' payload schema on purpose — a lifecycle
	 * column may only move through its own named command — so sending it here must change
	 * nothing, even though the envelope's other field is accepted.
	 */
	it("will not move a lifecycle column through an update payload", async () => {
		const id = await seedNotice({
			daysAgo: 30,
			isPublished: true,
			noticeTypeId,
		});

		const res = await postCommand(
			{
				id,
				intents: [noticeCommands.updateNoticeDetails.name],
				is_published: false,
				title: "An edited title",
			},
			website,
		);

		expect(res.status).toBe(200);
		const row = await storedNotice(id);
		expect(row?.title).toBe("An edited title");
		expect(row?.isPublished).toBe(true);
		// And no ledger row: nothing transitioned, so nothing was published.
		expect(await postingsFor(id)).toHaveLength(0);
	});

	it("ignores timestamps and lifecycle columns a create tries to set", async () => {
		const envelope = createNoticeEnvelope({
			created_at: "1999-01-01T00:00:00.000Z",
			// A notice is born active; `is_archived` is on no payload in the vocabulary.
			is_archived: true,
		});

		const res = await postCommand(envelope, website);

		expect(res.status).toBe(201);
		const row = await storedNotice(envelope.id);
		expect(row?.isArchived).toBe(false);
		expect(row?.createdAt.getFullYear()).toBe(new Date().getFullYear());
	});
});
