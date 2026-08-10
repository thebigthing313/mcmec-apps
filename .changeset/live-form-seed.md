---
"website-management": patch
---

Seed edit forms from the live row instead of a one-shot read.

Route loaders read a collection once — `await c.preload()` then `c.get(id)` — and `preload()` resolves on the first sync commit. With Electric that commit is the shape snapshot, taken when the shape was created; everything since arrives afterwards in the change log. So an edit form seeded from loader data could open showing values the collection had already superseded.

That was not merely cosmetic. The submit handlers write every field back (`Object.assign(draft, value)`), so saving from a stale seed silently reverted whatever else had changed in the meantime — a lost update with no error and no warning. The previous PostgREST reads were always current, so this only appeared with the move to synced collections.

The five edit routes (notices, documents, meetings, insecticides, spray schedules) and the two detail views (notices, documents) now read their record from a live query. Because TanStack Form reads `defaultValues` only on mount, re-seeding means remounting, so the form carries a `key` derived from the row's `updated_at`. That key is latched on the first focus inside the form: until you touch it, it tracks the live row; afterwards it is yours, and a sync landing mid-edit will not pull text out from under you. Whoever saves last wins.

The spray schedule's municipality set lives in a separate collection with no `updated_at` of its own, so its linked ids are folded into the version stamp.
