/**
 * The registry: every command in the system, keyed by its name.
 *
 * Each slice of the cutover appends its domain module here; `notices` is the first (#152).
 * The full vocabulary is 49 commands across four domains (#134), so this list grows to that
 * and stops.
 */

import type { AnyCommand } from "./command";
import { NOTICE_COMMANDS } from "./website/notices";

const ALL = [...NOTICE_COMMANDS] as const;

// The callback is annotated rather than inferred: it stays correct whether ALL is empty (its
// element type is then `never`, which has no `.name`) or holds every command in the system.
export const COMMANDS = Object.fromEntries(
	ALL.map((c: AnyCommand) => [c.name, c]),
) as {
	[C in (typeof ALL)[number] as C["name"]]: C;
};

export type CommandName = keyof typeof COMMANDS;

export function isCommandName(value: string): value is CommandName {
	return Object.hasOwn(COMMANDS, value);
}
