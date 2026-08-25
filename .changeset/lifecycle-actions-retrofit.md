---
"@mcmec/ui": minor
"website-management": patch
---

Bring notices and job postings to the lifecycle-action convention

ADR 0001 was settled after these two tables had already been cut over, so both were built to a
rule that did not exist yet. Neither was broken; both disagreed with the convention the
remaining nine slices are meant to copy, which is what makes "copy the last slice" worth saying.

**Every lifecycle action is now a button that fires its own command.** Notices publishes and
archives from the detail view, the edit form and — for Publish/Unpublish — a list row. Job
postings, whose lifecycle actions were reachable only from inside the edit form, gains all four
on its detail view and Publish/Unpublish on its rows. `delete*` moves the other way: out of both
edit forms and into a `DangerZoneCard` on the detail page, which is the one placement ADR 0001
does not leave free.

**Save-and-X is real now, and it changed a live bug.** The edit forms fired their lifecycle
command immediately, so publishing with an unsaved title published the old one. A dirty form now
relabels its button and sends one request carrying both intents, which `dispatch.ts` runs in a
single transaction — so a refused `archiveNotice` takes the field save back with it, and
`toastOnError`'s `savedTogether` sentence says so.

**Dirtiness is a diff, not a flag.** `changedFields` compares the form's current values against
the live row and drives both the relabel and the payload, so the two cannot disagree. TanStack
Form's own `isDirty` is sticky — it stays true after the user reverts an edit — and a
"Save and Publish" built on that would hand `update*Details` an empty payload, which its own
non-empty refinement refuses with a 400. Dates compare by instant and Tiptap documents by
serialisation, since both arrive as fresh objects on every render.

**Two new shared pieces.** `RowActionsMenu` in `@mcmec/ui` is the shortcut surface a list row is
allowed to be: presentational, vocabulary-free, and never the only way to reach a command.
`runLifecycle` is app-local to `website-management` and is what composes the two intents, so
`@mcmec/ui` still never learns a command name. Both forms gained an `actions` render prop rather
than a plain node, because Save-and-X needs a read of the form's current values and the form
should keep owning its state.
