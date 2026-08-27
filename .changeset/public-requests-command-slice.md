---
"api": minor
"website-management": minor
"@mcmec/domain": minor
"@mcmec/schemas": minor
"@mcmec/sync": minor
---

Public request triage writes through named domain commands

Four commands — `website.submitPublicRequest`, `website.resolveRequest`, `website.reopenRequest`,
`website.deleteRequest` — and the slice that makes the vocabulary carry the one fact it had so far
only been able to gesture at: who may send a command when the answer is "anybody".

`submitPublicRequest` is the only command in forty-five with a **null permission**. A request is
filed by a member of the public holding no permission at all, and what stands in for one is
Turnstile and a honeypot. Those guard the *door* — a request arriving from a browser with no
session — not the command, so `POST /api/requests` stays while the other three bespoke doors
folded into the dispatcher and were deleted. The handler is shared; the route is not. What is left
on the route is the envelope, the honeypot, the Turnstile call and the id it mints so it can tell
the submitter what was filed. The insert, the transaction and the audit GUCs are the same handler
the staff commands run through.

**The boot assertion protecting that split had the wrong shape, and this is the slice that shows
it.** `dispatch.ts` asserted that the vocabulary contained no null-permission command at all —
correct for as long as none existed, and a flat contradiction of the design the moment one did.
The invariant worth protecting is a property of the *route*: `/api/commands` never serves a public
command. So the check became a derivation. The dispatcher builds its served set from the
vocabulary, a public command is simply not in it, and an intent naming one is refused the same way
a misspelled one is. There is nothing left to assert because there is nothing left to leak.
Filtering is right here in a way it was not for `WRITABLE`, whose entries are cutover debris a
slice is supposed to delete: the null-permission set is a permanent fact, not a shrinking to-do
list.

`permission` is now carried in the *type*, not only in the value, which is what makes the seam
honest at both ends. `CommandHandler` reads it the way it reads `targetless`: a public command's
handler is typed `session: null`, and a permissioned one still cannot be handed one. The
alternative — widening `session` to `SessionInfo | null` for all forty-five — would have made every
`manage_website` handler narrow a null it can never be given. The dispatcher's permission check
stops testing truthiness for the same reason, since everything it serves names a permission.

**`WRITABLE.public_requests` is deleted, and `insertable` goes with it.** It was the map's only
`insertable: false`, and the cleanest example in this effort of a bespoke boolean becoming a
vocabulary fact: the generic door had to be told, per table, that one of its three verbs was off,
with no way to say why or where the insert had gone instead. `WRITABLE` is down to one entry.

**The intake contract stops being written twice.** The per-type discriminated union lived in
`apps/api/src/requests.ts` as the authority and in `@mcmec/schemas` as "the client's copy of it",
under a comment asking whoever changed one to remember the other. The schemas package's copy is now
the command's payload, imported by the definition and parsed by the API — one spelling, and the
public app already validates against it before forwarding. The collection's Update schema is
deleted too: it declared contact corrections that no screen has ever offered and no command names.

On the screen, the status `<Select>` becomes one button per legal transition (ADR 0001), and Delete
moves into the danger zone card. That drops `in_progress`, which the dropdown had been offering as
a third equal choice and `CONTEXT.md` explicitly rejects — a request is either New or Resolved. No
command mints it; the enum value stays for rows that may already hold one, and Resolve accepts a
request in any state. #134's declined transition ordering stays declined: the server resolves or
reopens whatever it finds.

An anonymous submission now logs `audit_log.command = 'website.submitPublicRequest'` against a null
actor, where it used to log a null command like every other generic write. `setActor` takes a
nullable session for that one case, stamping the request's IP and id either way.
