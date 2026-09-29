import { NoticesRowSchema } from "@mcmec/schemas/db/notices";
import { createEagerCollection } from "../electric-collection";

/**
 * Public notices: written by Website Management, read by the Self Service Portal. One instance
 * serves both (#239).
 *
 * Unlike `meetings`, the proxy hands any authenticated session the full table, drafts included,
 * so the "only what the public sees" rule the portal's screens promise is applied in those routes
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
