import { NoticeTypesRowSchema } from "@mcmec/schemas/db/notice-types";
import { createEagerCollection } from "../electric-collection";

/** The Notice Categories the notices screens name each notice by. Read-only in central. */
export function create(apiUrl: string) {
	return createEagerCollection({
		apiUrl,
		commands: true,
		schema: NoticeTypesRowSchema,
		table: "notice_types",
	});
}
