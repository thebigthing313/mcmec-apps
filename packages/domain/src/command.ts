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
import type { TableName } from "@mcmec/schemas/tables";
import type z from "zod";

export type CommandDefinition<
	TName extends string = string,
	TPayload extends z.ZodType = z.ZodType,
	TTable extends TableName = TableName,
> = {
	/** `<domain>.<command>` — globally unique, so it fixes the table, the op and the permission. */
	readonly name: TName;
	/**
	 * The row this command is about. Inherited from the module's `.table()` binding, so a
	 * module cannot disagree with itself, and `packages/sync` derives a collection's write
	 * path from the union of these (#174). Naming a table is not touching a database — the
	 * definition still holds no query, no column types and no drizzle import.
	 */
	readonly table: TTable;
	/** Inherited from the domain. `null` means "declared public, served from its own route". */
	readonly permission: string | null;
	readonly payload: TPayload;
	/** Marks the commands that mint a row, so the dispatcher can answer 201 rather than 200. */
	readonly creates?: true;
};

export type AnyCommand = CommandDefinition<
	string,
	// biome-ignore lint/suspicious/noExplicitAny: registry values are heterogeneous by construction
	z.ZodType<any, any>,
	TableName
>;

export type PayloadOf<TDef extends AnyCommand> = z.infer<TDef["payload"]>;

/**
 * Opens a domain, then a table within it.
 *
 * Two calls rather than one, because domain and table are different scopes: `website` owns
 * seven tables, so folding the table into `defineDomain` would re-declare `manage_website`
 * seven times — the duplication permission inheritance exists to remove (#135 Q11). Chained,
 * each fact is written once at the level it belongs to:
 *
 *     const website = defineDomain("website", "manage_website");
 *     const command = website.table("meetings");
 *     export const cancelMeeting = command("cancelMeeting", EmptyPayload);
 */
export function defineDomain<TDomain extends string>(
	domain: TDomain,
	permission: string | null,
) {
	return {
		table<TTable extends TableName>(table: TTable) {
			return function command<TName extends string, TPayload extends z.ZodType>(
				name: TName,
				payload: TPayload,
				options?: { creates?: true },
			): CommandDefinition<`${TDomain}.${TName}`, TPayload, TTable> {
				return {
					name: `${domain}.${name}` as const,
					payload,
					permission,
					table,
					...(options?.creates ? { creates: true as const } : {}),
				};
			};
		},
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
