/**
 * @mcmec/domain — the command vocabulary.
 *
 * Defines; does not execute. `apps/api` implements the handlers, `packages/sync` carries the
 * intent names on the wire, and the SPAs name the intent at the call site.
 */
export {
	type AnyCommand,
	buildCommand,
	type CommandDefinition,
	defineDomain,
	type PayloadOf,
} from "./command";
export {
	TiptapDocument,
	type TiptapDocumentType,
} from "./tiptap";
export { COMMANDS, type CommandName, isCommandName } from "./vocabulary";
export * as documentCategories from "./website/document-categories";
export * as documents from "./website/documents";
export * as insecticides from "./website/insecticides";
export * as jobPostings from "./website/job-postings";
export * as meetings from "./website/meetings";
export * as noticeCategories from "./website/notice-categories";
export * as notices from "./website/notices";
