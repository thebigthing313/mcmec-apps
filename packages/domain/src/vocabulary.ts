/**
 * The registry: every command in the system, keyed by its name.
 *
 * PARTIAL — `notices` and `job_postings`. The full vocabulary is 49 commands across four
 * domains (#134); the cutover (#140) brings in the rest.
 */
import { JOB_POSTING_COMMANDS } from "./website/job-postings";
import { NOTICE_COMMANDS } from "./website/notices";

const ALL = [...NOTICE_COMMANDS, ...JOB_POSTING_COMMANDS] as const;

export const COMMANDS = Object.fromEntries(ALL.map((c) => [c.name, c])) as {
	[C in (typeof ALL)[number] as C["name"]]: C;
};

export type CommandName = keyof typeof COMMANDS;

export function isCommandName(value: string): value is CommandName {
	return Object.hasOwn(COMMANDS, value);
}
