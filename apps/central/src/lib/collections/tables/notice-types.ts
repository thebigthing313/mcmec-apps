import { NoticeTypesRowSchema } from "@mcmec/schemas/db/notice-types";
import { createEagerCollection } from "../electric-collection";

/**
 * Notice Categories: the portal's notices screens name each notice by one, and Website
 * Management writes them.
 */
export function create(apiUrl: string) {
	return createEagerCollection({
		apiUrl,
		commands: true,
		schema: NoticeTypesRowSchema,
		table: "notice_types",
	});
}
