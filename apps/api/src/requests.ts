// Public intake — POST /api/requests (anonymous).
//
// The one bespoke write door #137 kept. The other three folded into POST /api/commands and were
// deleted; this one stays, because what stands in for a permission here is a Turnstile token and
// a honeypot, and those are checks on the DOOR — on a request arriving from a browser with no
// session — not on the command. `website.submitPublicRequest` is the vocabulary's only command
// with a null permission, and the dispatcher serves only the commands that name one, so this
// route is the only way to send it (#164).
//
// What is left here is exactly the anonymous part: the envelope around the payload, the honeypot,
// the Turnstile call, and the id this route mints so it can tell the submitter what was filed.
// The write itself — the insert, the transaction, the audit GUCs — is the shared handler in
// commands/website/public-requests.ts, the same code path the staff commands run through.

import { buildCommand, publicRequests } from "@mcmec/domain";
import type { Context } from "hono";
import { ZodError, z } from "zod";
import { setActor, setCommand } from "./actor";
import { submitPublicRequest } from "./commands/website/public-requests";
import { db } from "./db";
import { pgErrorResponse } from "./db-errors";

// The per-type question set is the command's payload now, imported from `@mcmec/schemas` by the
// definition. It used to be written out twice — once here as the authority and once in the
// schemas package as "the client's copy of it", with a comment asking whoever changed one to
// remember the other. The public app already validates against that copy before forwarding, so
// making it the payload leaves one spelling and no instruction to keep two in step.
const envelope = z.object({
	turnstileToken: z.string().min(1),
	honeypot: z.string().optional(),
	request: publicRequests.submitPublicRequest.payload,
});

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
	const secret = process.env.CLOUDFLARE_TURNSTILE_SECRETKEY;
	if (!secret) return false;
	const res = await fetch(
		"https://challenges.cloudflare.com/turnstile/v0/siteverify",
		{
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				secret,
				response: token,
				remoteip: ip || undefined,
			}),
		},
	);
	const data = (await res.json()) as { success?: boolean };
	return data.success === true;
}

export async function submitRequest(c: Context): Promise<Response> {
	const body = await c.req.json().catch(() => null);
	const parsed = envelope.safeParse(body);
	if (!parsed.success) {
		return c.json({ error: "invalid", issues: parsed.error.issues }, 422);
	}
	const { turnstileToken, honeypot, request } = parsed.data;

	// honeypot filled => bot. Return success without inserting so we don't tip it off.
	if (honeypot && honeypot.trim() !== "") return c.json({ success: true });

	const ip =
		c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for") ?? "";
	if (!(await verifyTurnstile(turnstileToken, ip))) {
		return c.json({ error: "verification failed" }, 400);
	}

	// The envelope above has already parsed the payload; running the command's own builder over
	// it is what makes this route send the command rather than merely resemble it. It is also
	// what would notice if the two ever came apart.
	const payload = buildCommand(publicRequests.submitPublicRequest, request);
	const id = crypto.randomUUID();

	try {
		// No session, so no actor — the audit row names the command and the IP. `setCommand` is
		// the reason this transaction exists at all: before commands, an anonymous submission
		// logged `audit_log.command = null` like every other generic write.
		const stampActor = setActor(null, c);
		await db.transaction(async (tx) => {
			await stampActor(tx);
			await setCommand(tx, publicRequests.submitPublicRequest.name);
			await submitPublicRequest({ id, payload, session: null, tx });
		});

		return c.json({ success: true, id });
	} catch (e) {
		if (e instanceof ZodError) {
			return c.json({ error: "invalid", issues: e.issues }, 422);
		}
		// e.g. a well-formed but nonexistent zip_code_id => FK violation, not a 500
		const res = pgErrorResponse(c, e, 422);
		if (res) return res;
		throw e;
	}
}
