/**
 * The registry: every command in the system, keyed by its name.
 *
 * Empty until the first table cuts over (#152 PR 2). That is deliberate — the machinery lands
 * as behaviour-free infrastructure, and an empty vocabulary still type-checks: `CommandName`
 * is `never`, the API's `Record<CommandName, CommandHandler>` is `{}`, and the dispatcher's
 * boot-time assertion still runs. Each slice appends its domain module here.
 *
 * The full vocabulary is 49 commands across four domains (#134).
 */

import type { AnyCommand } from "./command";

const ALL = [] as const;

// The callback is annotated rather than inferred: while ALL is empty its element type is
// `never`, and `never` has no `.name`. Widening it here keeps the line unchanged as slices
// append their domain modules.
export const COMMANDS = Object.fromEntries(
	ALL.map((c: AnyCommand) => [c.name, c]),
) as {
	[C in (typeof ALL)[number] as C["name"]]: C;
};

export type CommandName = keyof typeof COMMANDS;

export function isCommandName(value: string): value is CommandName {
	return Object.hasOwn(COMMANDS, value);
}
