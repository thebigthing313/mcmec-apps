/**
 * The client half of the command path: one envelope producer, one route.
 *
 * PROTOTYPE NOTE — #135 puts this in `packages/sync`. Renaming the package is mechanical and
 * would swamp the diff, so the prototype lands it beside the code it replaces (`crud.ts`) and
 * leaves the move to the cutover.
 *
 * `toCamelCaseKeys` has no successor here: the wire is snake_case end to end, and the API maps
 * to Drizzle's property names at the one place it hands data to Drizzle.
 */

/** #137: one route, because a globally-unique dotted name already fixes table, op and permission. */
export const COMMAND_PATH = "/api/commands";

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

export type CommandEnvelope = {
	intents: string[];
	id: string;
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
