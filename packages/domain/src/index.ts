/**
 * @mcmec/domain — the command vocabulary.
 *
 * Defines; does not execute. `apps/api` implements the handlers, `packages/sync` carries the
 * intent names on the wire, and the SPAs name the intent at the call site.
 */
// Re-exported so a consumer of the vocabulary gets the table union from the same place it
// gets the commands keyed on it — `apps/api` needs both and depends only on this package.
export type { TableName } from "@mcmec/schemas/tables";
export {
	type AnyCommand,
	buildCommand,
	type CommandDefinition,
	defineDomain,
	type PayloadOf,
} from "./command";
export * as employees from "./employees/employees";
export {
	TiptapDocument,
	type TiptapDocumentType,
} from "./tiptap";
export * as users from "./users/users";
export {
	COMMANDS,
	type CommandedTable,
	type CommandName,
	isCommandName,
} from "./vocabulary";
export * as documentCategories from "./website/document-categories";
export * as documents from "./website/documents";
export * as insecticides from "./website/insecticides";
export * as jobPostings from "./website/job-postings";
export * as meetings from "./website/meetings";
export * as mosquitoActivity from "./website/mosquito-activity";
export * as noticeCategories from "./website/notice-categories";
export * as notices from "./website/notices";
export * as publicRequests from "./website/public-requests";
export * as sprayMissions from "./website/spray-missions";
