---
"website-management": patch
---

Bring the two category registers inside the system

Notice Categories and Document Categories were two hand-rolled 315-line screens that differed
only in the noun — the tenth and eleventh copies of exactly the table `RecordIndex` was written
to end. Neither had search, sort, `aria-sort`, URL state, or a loading state, so both printed
"No categories found" while their collection was still syncing. Their Edit and Delete controls
were icon-only buttons with no accessible name, which made them the only controls in the
application a screen reader could not identify. And Delete fired on a single click with no
confirmation, guarded only by a client-side count.

Both are now composed from `RecordIndex`, with Edit as a named row action and Delete moved to a
`DangerZoneCard` on a new `$categoryId` detail page — the shape ADR 0001 already required of
Insecticides for the same reason. The two screens share one `CategoryForm` rather than a second
pair of copies.

The reason Delete is unavailable is stated in the detail page's own text rather than in a tooltip
hung off the disabled button. A disabled button takes no focus, so the previous screen explained
its own rule only to a mouse pointer that happened to hover.
