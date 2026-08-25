---
"@mcmec/schemas": minor
"@mcmec/domain": minor
"@mcmec/sync": minor
"api": patch
---

Derive a collection's write path from the command vocabulary, so a cut-over table's two halves cannot disagree.

A command definition now carries the table it is about, bound once per module via `defineDomain(...).table(...)`. `packages/sync` keys its collection options off that union: a commanded table must declare `commands: true` and may carry no Insert/Update schema, and an uncommanded one may not declare it — checked at the call site, with the vocabulary imported type-only so no app pays for it at runtime. `apps/api` refuses at boot to serve a generic write door for a table that has commands. Table names come from a new `@mcmec/schemas/tables` union rather than being free strings.
