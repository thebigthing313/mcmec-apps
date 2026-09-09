# Lifecycle actions are buttons, never form fields

## Context

Named commands split every write in two: `update*Details` carries a record's fields, and a
lifecycle command (`publishNotice`, `cancelMeeting`, `closeJobPosting`) carries one state
change. The split is enforced by *omission* — lifecycle columns appear in no `update*Details`
payload schema, so a lifecycle column can only move through a command that names it.

That enforcement is invisible in the database and invisible in the types. The only place a
person can see it is the screen. The first two tables cut over disagreed about where: a notice
published from its detail view, a job posting only from inside its edit form — where publishing
was indistinguishable from editing and saving.

## Decision

**Placement is free. Control shape is not.**

A lifecycle action may appear on the detail view, in the edit form, and on a list row — as many
of the three as convenience wants, presented inline or under an ellipsis menu. What it may never
be is a **form field**. It is always a control that executes its command on click, on its own,
outside the form's submit.

Concretely:

- **Never a switch or a checkbox.** A switch reads as a field the user sets and then saves,
  which is exactly the conflation the command split exists to remove.
- **On a dirty edit form, the button relabels** — "Publish" becomes "Save and Publish" and sends
  one request carrying both intents. It does not silently fire one command, and it does not
  quietly fire two under the old label.
- **A list row is a shortcut surface only.** Any command reachable from a row is also reachable
  from the detail view; no command lives on a row alone.
- **Destructive commands are the one exception to free placement.** `delete*` lives on the
  detail page and nowhere else, inside a danger zone card, behind a confirm dialog.
- **A multi-state status gets one button per legal transition**, not a dropdown of states. A
  dropdown assigns a state and offers every value equally; it cannot express that a transition
  requires a reason, or that it may be refused.

## Consequences

**Save-and-X is atomic.** Both intents run in one transaction, so a refused lifecycle command
rolls the field save back with it. The user's typing is still in the form, so nothing is lost,
but the refusal message has to say that the changes were not saved either.

**Three tables need a detail page that does not exist.** Meetings, insecticides and spray
missions render their edit form directly at `$id.tsx` with no read-only detail view. Each gains
one, with the form moving to `$id_.edit.tsx`, inside that table's own cutover slice — including
insecticides, which has no lifecycle columns at all and gains a detail page purely to have
somewhere to put the danger zone. The rule cannot carve out an exception for the tables whose
only command is Delete, because that is most of them.

**Buttons expose the transitions a dropdown was hiding.** A spray mission had no route back to
Scheduled once delayed or cancelled — the dropdown supplied one and no command did, so
`rescheduleSprayMission` is added. A public request's dropdown offered `in_progress`, which the
glossary explicitly rejects; the button convention drops it rather than minting a command for
it. Neither gap was visible while a `<Select>` was assigning states directly.
