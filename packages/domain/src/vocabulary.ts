/**
 * The registry: every command in the system, keyed by its name.
 *
 * Each slice of the cutover appends its domain module here; `notices` and `job_postings` are
 * the first two (#152), followed by the three plain lookup tables (#159). The full vocabulary is
 * 49 commands across four domains (#134), so this list grows to that and stops.
 */

import type { TableName } from "@mcmec/schemas/tables";
import type { AnyCommand } from "./command";
import { DOCUMENT_CATEGORY_COMMANDS } from "./website/document-categories";
import { DOCUMENT_COMMANDS } from "./website/documents";
import { INSECTICIDE_COMMANDS } from "./website/insecticides";
import { JOB_POSTING_COMMANDS } from "./website/job-postings";
import { MEETING_COMMANDS } from "./website/meetings";
import { MOSQUITO_ACTIVITY_COMMANDS } from "./website/mosquito-activity";
import { NOTICE_CATEGORY_COMMANDS } from "./website/notice-categories";
import { NOTICE_COMMANDS } from "./website/notices";
import { SPRAY_MISSION_COMMANDS } from "./website/spray-missions";

const ALL = [
	...NOTICE_COMMANDS,
	...JOB_POSTING_COMMANDS,
	...NOTICE_CATEGORY_COMMANDS,
	...DOCUMENT_CATEGORY_COMMANDS,
	...INSECTICIDE_COMMANDS,
	...DOCUMENT_COMMANDS,
	...MEETING_COMMANDS,
	...SPRAY_MISSION_COMMANDS,
	...MOSQUITO_ACTIVITY_COMMANDS,
] as const;

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

/**
 * The tables the vocabulary names — the single fact both halves of a cut-over now read.
 *
 * `packages/sync` takes the TYPE and refuses, at the call site, a collection whose `commands`
 * flag disagrees with it; `apps/api` takes the SET and refuses, at boot, a `WRITABLE` entry
 * for a table that has commands. Neither half is hand-written any more, so the pair that
 * broke the documents slice (#160) — table out of `WRITABLE`, collection still generic — can
 * no longer be spelled.
 *
 * The type is exported for a type-only import: `packages/sync` erases it at build, so the
 * three apps that name no intent (`hr`, `admin`, `central`) pay nothing at runtime for it.
 */
export type CommandedTable = (typeof ALL)[number]["table"];

export const COMMANDED_TABLES: ReadonlySet<TableName> = new Set(
	ALL.map((c: AnyCommand) => c.table),
);
