/**
 * @mcmec/domain — the command vocabulary.
 *
 * Defines; does not execute. `apps/api` implements the handlers, `packages/collections` carries
 * the intent names on the wire, and the SPAs name the intent at the call site.
 */
export {
	type AnyCommand,
	buildCommand,
	type CommandDefinition,
	defineDomain,
	type PayloadOf,
} from "./command";
export { COMMANDS, type CommandName, isCommandName } from "./vocabulary";
export * as jobPostings from "./website/job-postings";
export * as notices from "./website/notices";
