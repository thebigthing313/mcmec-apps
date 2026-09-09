/**
 * The shape of a rich-text document, as commands mean it.
 *
 * This is domain, not implementation: what `content` may be is part of what a payload MEANS,
 * so a handler never has to guess whether it was handed a document or a null.
 *
 * The two slices that landed first disagreed. `notices` took `content` straight from
 * `NoticesRowSchema.shape.content`, which is `z.any()` — so `updateNoticeDetails` would happily
 * carry `content: null` into a NOT NULL column and fail as a 500 rather than a 422.
 * `job_postings` hand-rolled an object schema. The object is the right answer and this is its
 * one home.
 *
 * It stops at "a JSON object" rather than describing Tiptap's node grammar. Two reasons: the
 * grammar is the editor's, and this package must not learn it to stay a pure Zod leaf; and
 * tightening further would start refusing documents already stored, which is new behaviour
 * rather than the re-homing this refactor is.
 *
 * Exactly two columns in the schema hold one — `notices.content` and `job_postings.content`.
 * `notice_postings.snapshot` is written by the server from a notice, never sent by a client,
 * and `public_requests.details` is a discriminated union with its own schema.
 */
import z from "zod";

export const TiptapDocument = z.record(z.string(), z.unknown());

export type TiptapDocumentType = z.infer<typeof TiptapDocument>;
