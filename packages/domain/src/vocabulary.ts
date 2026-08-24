/**
 * The registry: every command in the system, keyed by its name.
 *
 * PROTOTYPE SCOPE — `notices` only. The full vocabulary is 49 commands across four domains
 * (#134); this slice carries the seven that let one table run end-to-end.
 */
import { NOTICE_COMMANDS } from "./website/notices";

const ALL = [...NOTICE_COMMANDS] as const;

export const COMMANDS = Object.fromEntries(ALL.map((c) => [c.name, c])) as {
	[C in (typeof ALL)[number] as C["name"]]: C;
};

export type CommandName = keyof typeof COMMANDS;

export function isCommandName(value: string): value is CommandName {
	return Object.hasOwn(COMMANDS, value);
}
