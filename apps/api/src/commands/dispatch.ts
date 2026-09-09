/**
 * POST /api/commands — the one write door.
 *
 *   { "intents": ["website.updateNoticeDetails", "website.publishNotice"],
 *     "id": "0f9c…", "title": "…" }
 *   -> 200 { "txid": "84213" }        (201 when the request contained a create)
 *
 * The client names what it meant and ships the fields it changed; the server runs
 * `buildCommand` once per intent, and Zod's unknown-key stripping is what lets one flat body
 * serve several commands. Intents execute in the order the client sent them.
 */
import type { AnyCommand, CommandName } from "@mcmec/domain";
import { buildCommand, COMMANDS, isCommandName } from "@mcmec/domain";
import type { Context } from "hono";
import { ZodError } from "zod";
import { getTxid, setActor, setCommand } from "../actor";
import { db } from "../db";
import { pgErrorResponse } from "../db-errors";
import { getSessionInfo } from "../session";
import { REGISTRY } from "./registry";
import { type AfterCommit, CommandError, type CommandHandler } from "./types";

/** A command this route will serve — which is to say, one that names a permission. */
type ServedCommand = AnyCommand & { permission: string };

/**
 * What this route serves: the vocabulary minus the commands that declare their own door.
 *
 * This used to be a boot-time assertion that the vocabulary contained NO `permission: null`
 * command at all, and it was the right guard for as long as none existed. `submitPublicRequest`
 * is the first, and it makes the two facts come apart: the invariant worth protecting is a
 * property of this ROUTE — `/api/commands` never serves a public command — and the assertion
 * had been stating it as a property of the VOCABULARY. Stated that way it forbids the design
 * #137 chose, where a public command is declared here and served from `POST /api/requests`
 * calling the same handler.
 *
 * So the check becomes a derivation, and the refusal becomes structural: a public command is
 * not in this table, so there is nothing to assert about it and nothing to leak. Filtering is
 * right here in a way it was not for `WRITABLE` (#150 Q5) — the null-permission set is a
 * permanent fact about who may send a command, not cutover debris that a slice is supposed to
 * delete and might forget.
 *
 * The permission type is what makes it honest: every value in this map has a non-null
 * `permission`, so the check below reads it directly instead of testing a truthiness that a
 * public command would silently pass.
 */
const SERVED = new Map<string, ServedCommand>(
	(Object.values(COMMANDS) as AnyCommand[])
		.filter((c): c is ServedCommand => c.permission !== null)
		.map((c) => [c.name, c]),
);

type Envelope = { intents: string[]; id?: string } & Record<string, unknown>;

/**
 * Two refusals, deliberately distinct: `malformed_envelope` means the request was not shaped
 * like a command request at all, `unknown_command` means it named something the vocabulary
 * does not have. Only the second tells the caller their command is gone.
 */
function readEnvelope(body: unknown): Envelope | CommandError {
	if (!body || typeof body !== "object" || Array.isArray(body)) {
		return new CommandError(400, {
			error: "malformed_envelope",
			reason: "body must be an object",
		});
	}
	const { intents } = body as { intents?: unknown };
	if (
		!Array.isArray(intents) ||
		intents.length === 0 ||
		!intents.every((i) => typeof i === "string")
	) {
		return new CommandError(400, {
			error: "malformed_envelope",
			reason: "intents must be a non-empty array of command names",
		});
	}
	if (new Set(intents).size !== intents.length) {
		return new CommandError(400, {
			error: "malformed_envelope",
			reason: "intents contains a duplicate",
		});
	}
	for (const intent of intents) {
		if (!isCommandName(intent)) {
			return new CommandError(400, {
				error: "unknown_command",
				reason: `no such command: ${intent}`,
			});
		}
		// A real command, but not one this door has. Same code, because from here the two are
		// the same refusal — the caller cannot send it either way — and a different one would
		// only tell them which other route to go looking for.
		if (!SERVED.has(intent)) {
			return new CommandError(400, {
				error: "unknown_command",
				reason: `${intent} is public and is served from its own route`,
			});
		}
	}
	return body as Envelope;
}

export async function postCommands(c: Context): Promise<Response> {
	const envelope = readEnvelope(await c.req.json().catch(() => null));
	if (envelope instanceof CommandError) {
		return c.json(envelope.body, envelope.status);
	}

	// Present by construction: `readEnvelope` refused every intent this map does not hold.
	const definitions = envelope.intents.map(
		(name) => SERVED.get(name) as ServedCommand,
	);

	// Permission is checked before any builder runs, so a caller who may not send a command
	// never gets its payload inspected. Two commands in one request need both permissions.
	const session = await getSessionInfo(c.req.raw.headers);
	if (!session) return c.json({ error: "unauthenticated" }, 401);
	for (const def of definitions) {
		if (!session.permissions.includes(def.permission)) {
			return c.json({ error: "forbidden" }, 403);
		}
	}

	// Almost every command is about one row, addressed by the envelope id. The exception is a
	// command that declares itself `targetless` — the mosquito import, which addresses a year
	// (#163). It may not share an envelope with a row-scoped command, because the one `id` a
	// request carries would then mean something to half its intents and nothing to the rest.
	const targetless = definitions.filter((d) => d.targetless);
	if (targetless.length > 0 && definitions.length > 1) {
		return c.json(
			{
				error: "malformed_envelope",
				reason: `${targetless[0]?.name} is not about a row and must be sent alone`,
			},
			400,
		);
	}

	const id = typeof envelope.id === "string" ? envelope.id : "";
	if (!id && targetless.length === 0) {
		return c.json(
			{ error: "malformed_envelope", reason: "id must be a non-empty string" },
			400,
		);
	}

	try {
		const stampActor = setActor(session, c);
		const { txid, afterCommit } = await db.transaction(async (tx) => {
			await stampActor(tx);
			const thunks: AfterCommit[] = [];
			for (const def of definitions) {
				// Re-set per command, not once per request: a save meaning updateDetails +
				// publish is two writes in one transaction, and each audit row has to name the
				// command that wrote it.
				await setCommand(tx, def.name);
				const payload = buildCommand(def, envelope);
				// The registry is exhaustiveness-checked at its definition; here the loop has
				// lost the correlation between a definition and its handler, so TypeScript
				// intersects every payload type in the union. One cast at the dispatch seam is
				// the price of that — the type safety lives in registry.ts, not in this loop.
				const handler = REGISTRY[
					def.name as CommandName
				] as CommandHandler<AnyCommand>;
				// `id` is typed away for a targetless handler, which by construction cannot
				// read it; the loop has already lost that correlation, so the cast at this
				// seam covers it along with the payload union.
				const after = await handler({
					id: id as string,
					payload,
					session,
					tx,
				});
				if (after) thunks.push(after);
			}
			return { afterCommit: thunks, txid: await getTxid(tx) };
		});

		for (const thunk of afterCommit) {
			// A thunk that throws is logged; the write is already committed, so the response
			// still succeeds.
			await thunk().catch((e) =>
				console.error("[commands] after-commit failed", e),
			);
		}

		const created = definitions.some((d) => d.creates);
		return c.json({ txid }, created ? 201 : 200);
	} catch (e) {
		if (e instanceof CommandError) return c.json(e.body, e.status);
		if (e instanceof ZodError) {
			return c.json({ error: "invalid", issues: e.issues }, 422);
		}
		// Catch-all: an FK violation that no handler claimed is bad input, not a conflict.
		return pgErrorResponse(c, e, 422) ?? rethrow(e);
	}
}

function rethrow(e: unknown): never {
	throw e;
}
