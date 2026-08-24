/**
 * What a command IS, and nothing about how it runs.
 *
 * A command definition is three things — a globally-unique dotted name, the permission a
 * caller must hold, and the Zod schema its payload must satisfy. It touches no database and
 * imports nothing from the API. `apps/api` implements what this package defines: its handler
 * registry is typed `Record<CommandName, CommandHandler>`, so adding a definition here breaks
 * the API's build until someone implements it. That compile error is the whole point of the
 * split.
 */
import type z from "zod";

export type CommandDefinition<
	TName extends string = string,
	TPayload extends z.ZodType = z.ZodType,
> = {
	/** `<domain>.<command>` — globally unique, so it fixes the table, the op and the permission. */
	readonly name: TName;
	/** Inherited from the domain. `null` means "declared public, served from its own route". */
	readonly permission: string | null;
	readonly payload: TPayload;
	/** Marks the commands that mint a row, so the dispatcher can answer 201 rather than 200. */
	readonly creates?: true;
};

// biome-ignore lint/suspicious/noExplicitAny: registry values are heterogeneous by construction
export type AnyCommand = CommandDefinition<string, z.ZodType<any, any>>;

export type PayloadOf<TDef extends AnyCommand> = z.infer<TDef["payload"]>;

/**
 * Opens a domain. Permission is declared once here and inherited by every command in it, so
 * the dispatcher reads one field and never learns what a domain is (#135 Q11).
 */
export function defineDomain<TDomain extends string>(
	domain: TDomain,
	permission: string | null,
) {
	return function command<TName extends string, TPayload extends z.ZodType>(
		name: TName,
		payload: TPayload,
		options?: { creates?: true },
	): CommandDefinition<`${TDomain}.${TName}`, TPayload> {
		return {
			name: `${domain}.${name}` as const,
			payload,
			permission,
			...(options?.creates ? { creates: true as const } : {}),
		};
	};
}

/**
 * Parses one command's payload out of a request body.
 *
 * Runs server-side only (#137). The client names its intents and ships the fields it changed;
 * the dispatcher runs this once per intent, and Zod's unknown-key stripping is what lets a
 * single flat body serve two commands in one request. Throws `ZodError`, which the dispatcher
 * maps to 422.
 */
export function buildCommand<TDef extends AnyCommand>(
	def: TDef,
	body: unknown,
): PayloadOf<TDef> {
	return def.payload.parse(body) as PayloadOf<TDef>;
}
