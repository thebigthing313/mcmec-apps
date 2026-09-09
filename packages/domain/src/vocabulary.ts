/**
 * The registry: every command in the system, keyed by its name.
 *
 * Each slice of the cutover appended its domain module here; `notices` and `job_postings` were
 * the first two (#152), and `employees` + `users` are the last (#165). The vocabulary is now
 * complete and nothing is left to append: `reference` is the fourth domain #134 named and ships
 * zero commands, because the reference-data screen it would serve does not exist yet.
 *
 * **51 commands, against #134's 50.** The one addition is `website.rescheduleSprayMission`, and
 * it is not a slip: ADR 0001 replaced the mission status `<Select>` with one button per legal
 * transition, and doing that exposed that a delayed or cancelled mission had no route back to
 * Scheduled. The dropdown had been supplying one and no command did.
 */

import type { AnyCommand } from "./command";
import { EMPLOYEE_COMMANDS } from "./employees/employees";
import { USER_COMMANDS } from "./users/users";
import { DOCUMENT_CATEGORY_COMMANDS } from "./website/document-categories";
import { DOCUMENT_COMMANDS } from "./website/documents";
import { INSECTICIDE_COMMANDS } from "./website/insecticides";
import { JOB_POSTING_COMMANDS } from "./website/job-postings";
import { MEETING_COMMANDS } from "./website/meetings";
import { MOSQUITO_ACTIVITY_COMMANDS } from "./website/mosquito-activity";
import { NOTICE_CATEGORY_COMMANDS } from "./website/notice-categories";
import { NOTICE_COMMANDS } from "./website/notices";
import { PUBLIC_REQUEST_COMMANDS } from "./website/public-requests";
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
	...PUBLIC_REQUEST_COMMANDS,
	...EMPLOYEE_COMMANDS,
	...USER_COMMANDS,
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
 * The tables the vocabulary names.
 *
 * `packages/sync` refuses, at the call site, a collection whose `commands` flag disagrees
 * with this — which is now the whole of whether a table can be written at all, since #140
 * deleted the generic door a mismatch used to route back to. Derived, never hand-written, so
 * the pair that broke the documents slice (#160) cannot be spelled.
 *
 * The runtime `COMMANDED_TABLES` set stood beside this until #140: `apps/api` read it at boot
 * to refuse a `WRITABLE` entry for a commanded table. `WRITABLE` is gone, so there is nothing
 * left to assert against and the set went with it.
 *
 * Exported for a type-only import: `packages/sync` erases it at build, so the three apps that
 * name no intent (`hr`, `admin`, `central`) pay nothing at runtime for it.
 */
export type CommandedTable = (typeof ALL)[number]["table"];
