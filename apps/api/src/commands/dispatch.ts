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

// Boot-time assertion: `permission: null` means "declared public, served from its own route"
// (today, POST /api/requests). If one ever reached this dispatcher it would be an open door.
for (const command of Object.values(COMMANDS) as AnyCommand[]) {
	if (command.permission === null) {
		throw new Error(
			`command ${command.name} has no permission and cannot be served from /api/commands`,
		);
	}
}

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
	}
	return body as Envelope;
}

export async function postCommands(c: Context): Promise<Response> {
	const envelope = readEnvelope(await c.req.json().catch(() => null));
	if (envelope instanceof CommandError) {
		return c.json(envelope.body, envelope.status);
	}

	const definitions: AnyCommand[] = envelope.intents.map(
		(name) => COMMANDS[name as keyof typeof COMMANDS],
	);

	// Permission is checked before any builder runs, so a caller who may not send a command
	// never gets its payload inspected. Two commands in one request need both permissions.
	const session = await getSessionInfo(c.req.raw.headers);
	if (!session) return c.json({ error: "unauthenticated" }, 401);
	for (const def of definitions) {
		if (def.permission && !session.permissions.includes(def.permission)) {
			return c.json({ error: "forbidden" }, 403);
		}
	}

	const id = typeof envelope.id === "string" ? envelope.id : "";
	if (!id) {
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
				const after = await handler({ id, payload, session, tx });
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
