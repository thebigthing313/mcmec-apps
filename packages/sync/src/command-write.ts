/**
 * The client half of the command path: one envelope producer, one route.
 *
 * Lands beside `crud.ts`, the generic write path it replaces table by table (#140). The route
 * itself lives in `./routes` — `COMMAND_PATH` is the one URL both halves agree on, and the API
 * takes it from the same dependency-free module (#148).
 *
 * `toCamelCaseKeys` has no successor here: the wire is snake_case end to end, and the API maps
 * to Drizzle's property names at the one place it hands data to Drizzle.
 *
 * Exposed as its own export (`@mcmec/sync/command-write`) alongside `./routes`, and for the same
 * reason: it imports nothing but that module, so a consumer can take a refusal's sentence
 * without taking TanStack DB and Electric with it. `@mcmec/ui` is the consumer — `toastOnError`
 * is the one helper that genuinely needs both sonner and `findCommandRefusal` (#165).
 */
import { COMMAND_PATH } from "./routes";

/**
 * What a mutation must carry to say what it meant.
 *
 * `intents` is a LIST because TanStack DB merges two updates in one transaction by REPLACING
 * metadata whole, last-write-wins (#136) — and because a save that edits a title and publishes
 * is genuinely two commands.
 *
 * `arguments` is the channel for values that are not columns of the row (`municipality_ids`),
 * which otherwise cannot reach the server through a collection handler.
 */
export type CommandMetadata = {
	intents: string[];
	arguments?: Record<string, unknown>;
};

/** A refusal that carries something the user can act on — a 409's `message`, not a status code. */
export class CommandRefusedError extends Error {
	constructor(
		readonly status: number,
		readonly error: string,
		message: string,
		readonly reason?: string,
	) {
		super(message);
		this.name = "CommandRefusedError";
	}
}

/**
 * Finds the refusal inside whatever a collection handler's rejection was wrapped in.
 *
 * The collection wraps the handler's error, so a caller that wants the server's sentence has
 * to walk the cause chain. That walk belongs next to the class that is thrown, not copied into
 * every app's toast helper. `name` is checked rather than `instanceof` so a refusal still reads
 * as one across a bundle boundary.
 */
export function findCommandRefusal(
	error: unknown,
): CommandRefusedError | undefined {
	let current = error;
	for (let depth = 0; current && depth < MAX_CAUSE_DEPTH; depth++) {
		if (
			typeof current === "object" &&
			"name" in current &&
			(current as { name?: string }).name === "CommandRefusedError"
		) {
			return current as CommandRefusedError;
		}
		current = (current as { cause?: unknown }).cause;
	}
	return undefined;
}

/** Deep enough for the collection's own wrapping; short enough that a cycle cannot hang it. */
const MAX_CAUSE_DEPTH = 5;

/**
 * Reads the intents off a pending mutation.
 *
 * Metadata arrives typed bare `unknown`, so this narrows. It THROWS when metadata is missing
 * rather than defaulting: TanStack DB merges metadata with `??`, so a metadata-less write
 * silently INHERITS the previous mutation's intents (#136) — a default here would turn that
 * into a wrong command name in the audit log instead of a loud failure.
 */
export function readCommandMetadata(metadata: unknown): CommandMetadata {
	const meta = metadata as Partial<CommandMetadata> | undefined;
	if (!meta || !Array.isArray(meta.intents) || meta.intents.length === 0) {
		throw new Error(
			"write has no command intent — every mutation must pass { metadata: { intents: [...] } }",
		);
	}
	return { arguments: meta.arguments, intents: meta.intents };
}

/**
 * `id` is optional because one command is not about a row: the mosquito import replaces every
 * row for the years its payload names, so there is nothing for an id to point at and the
 * definition says so (#163). Every other envelope carries one, and the dispatcher refuses the
 * ones that should.
 */
export type CommandEnvelope = {
	intents: string[];
	id?: string;
} & Record<string, unknown>;

/**
 * Posts one envelope and returns its txid.
 *
 * A 2xx without a txid throws: the txid is how optimistic state settles, and a response that
 * cannot settle it is a broken contract rather than a slow one.
 */
export async function sendCommand(
	apiUrl: string,
	envelope: CommandEnvelope,
): Promise<number> {
	const res = await fetch(`${apiUrl}${COMMAND_PATH}`, {
		body: JSON.stringify(envelope),
		credentials: "include",
		headers: { "content-type": "application/json" },
		method: "POST",
	});

	const body = (await res.json().catch(() => null)) as {
		txid?: unknown;
		error?: unknown;
		reason?: unknown;
		message?: unknown;
	} | null;

	if (!res.ok) {
		throw new CommandRefusedError(
			res.status,
			String(body?.error ?? res.statusText),
			// The 409s carry a sentence written for the person who clicked. Everything else
			// falls back to the machine-readable code.
			String(body?.message ?? body?.error ?? res.statusText),
			body?.reason == null ? undefined : String(body.reason),
		);
	}

	const txid = Number(body?.txid);
	if (!Number.isFinite(txid)) {
		throw new Error(
			`${envelope.intents.join(", ")} returned ${res.status} without a txid`,
		);
	}
	return txid;
}
