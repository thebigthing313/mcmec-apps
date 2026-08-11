import { useState } from "react";

// Keeps an edit form seeded from a LIVE collection row instead of a one-shot read.
//
// Route loaders read a collection once — `await c.preload()` then `c.get(id)`. `preload()`
// resolves when the sync layer marks the collection ready, which Electric does on the
// `up-to-date` control message. That message does NOT mean "current as of now". It arrives
// on the log catch-up request (`?offset=0_0&handle=…`), which our shape proxy passes through
// with Electric's `cache-control: public, max-age=60, stale-while-revalidate=300`. So a cold
// page load can replay a CACHED catch-up ending in `up-to-date`, mark the collection ready,
// and hand the loader rows up to ~60s old — up to ~6 minutes under stale-while-revalidate.
// The live long-poll lands moments later and the collection converges, but the loader has
// already read.
//
// (The initial `offset=-1` snapshot is cached for a week, but it ends in `snapshot-end`,
// which does not mark the collection ready — so it is not the culprit here.)
//
// That is not merely cosmetic: `onUpdate` sends the diff between the form value and the
// LIVE collection row, so any field left stale in the seed differs from current and gets
// written back — silently reverting whatever changed in the meantime.
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
