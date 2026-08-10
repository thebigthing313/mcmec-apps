import { useState } from "react";

// Keeps an edit form seeded from a LIVE collection row instead of a one-shot read.
//
// Route loaders read a collection once — `await c.preload()` then `c.get(id)` — and
// `preload()` resolves on the first sync commit. With Electric that commit is the shape
// SNAPSHOT, taken when the shape was created; everything since arrives afterwards in the
// change log. So a form seeded from loader data can open showing values the collection has
// already superseded. That is not merely cosmetic: the submit handlers write every field
// back (`Object.assign(draft, value)`), so saving from a stale seed silently reverts
// whatever else changed in the meantime.
//
// TanStack Form reads `defaultValues` only on mount, so re-seeding means remounting — hence
// a `key` derived from the row's version. The key is LATCHED on the first focus inside the
// form: before you touch it, it tracks the live row; after, it is yours and a sync landing
// mid-edit will not yank text out from under you. Whoever saves last wins, which is the
// agreed behaviour here.
export function useFormSeed(version: string): {
	seedKey: string;
	latchProps: { onFocusCapture: () => void };
} {
	const [frozen, setFrozen] = useState<string | null>(null);
	return {
		latchProps: { onFocusCapture: () => setFrozen((k) => k ?? version) },
		seedKey: frozen ?? version,
	};
}

// Version stamp for a synced row. `updated_at` is maintained by the set_updated_at trigger on
// every table these forms edit, so it changes on exactly the writes we need to re-seed for.
export function rowVersion(
	row: { id: string; updated_at: Date | string },
	...extra: string[]
): string {
	const stamp = new Date(row.updated_at).getTime();
	return [row.id, stamp, ...extra].join(":");
}
