---
"central": minor
"@mcmec/sync": patch
---

Replace central's eager `getDb()` with a session collection registry. Routes ask for the tables they need in `beforeLoad` and receive them, typed, through route context. Each table's code downloads the first time a route asks for it, and sign-out cleans up every collection and throws the set away so nothing reaches the next User. The screens look and work the same. Central also gets its own Vitest suite, which runs in CI.

`@mcmec/sync` drops `collections/central`, which nothing imports any more: central's collection definitions, Electric factory and command write path now live in `apps/central`.
