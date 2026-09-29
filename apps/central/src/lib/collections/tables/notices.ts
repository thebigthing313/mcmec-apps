import { NoticesRowSchema } from "@mcmec/schemas/db/notices";
import { createEagerCollection } from "../electric-collection";

/**
 * Public notices, read-only in central.
 *
 * Unlike `meetings`, the proxy hands any authenticated session the full table, drafts included,
 * so the "only what the public sees" rule central's screens promise is applied in those routes
 * rather than here — a collection that quietly dropped rows would be a second, invisible read
 * rule disagreeing with the proxy's.
 */
export function create(apiUrl: string) {
	return createEagerCollection({
		apiUrl,
		commands: true,
		schema: NoticesRowSchema,
		table: "notices",
	});
}
