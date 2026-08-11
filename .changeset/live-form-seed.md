---
"website-management": patch
---

Seed edit forms from the live row instead of a one-shot read.

Route loaders read a collection once — `await c.preload()` then `c.get(id)`. `preload()` resolves when the sync layer marks the collection ready, which Electric does on the `up-to-date` control message — and that message does not mean "current as of now". It arrives on the log catch-up request, which the shape proxy passes through with Electric's `cache-control: public, max-age=60, stale-while-revalidate=300`. A cold page load can therefore replay a cached catch-up ending in `up-to-date`, mark the collection ready, and hand the loader rows up to ~60 seconds old, or ~6 minutes under stale-while-revalidate. The live long-poll lands moments later and the collection converges, but the loader has already read.

That was not merely cosmetic. `onUpdate` sends the diff between the submitted form value and the live collection row, so any field left stale in the seed differs from current and is written back — silently reverting whatever else had changed, with no error and no warning. The previous PostgREST reads were always current, so this only appeared with the move to synced collections.

The five edit routes (notices, documents, meetings, insecticides, spray schedules) and the two detail views (notices, documents) now read their record from a live query. Because TanStack Form reads `defaultValues` only on mount, re-seeding means remounting, so the form carries a `key` derived from the row's `updated_at`. That key is latched on the first focus inside the form: until you touch it, it tracks the live row; afterwards it is yours, and a sync landing mid-edit will not pull text out from under you. Whoever saves last wins.

The spray schedule's municipality set lives in a separate collection with no `updated_at` of its own, so its linked ids are folded into the version stamp.
