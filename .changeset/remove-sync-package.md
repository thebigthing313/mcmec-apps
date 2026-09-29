---
"@mcmec/domain": minor
"@mcmec/ui": patch
"api": patch
"central": patch
"public": patch
---

Remove the `@mcmec/sync` package (#251). Nothing behaves differently; each piece that was still in use now lives with the code that uses it.

`@mcmec/domain` exports `COMMAND_PATH` from a new dependency-free `@mcmec/domain/routes` subpath. `api` serves the command route from it and `central` posts to it.

`public` reads its SSR shapes with its own `fetchShapeSnapshot`, and keeps its own copy of the shape path and the Electric row parser. Central keeps the other copy, and a test in central pins the two to the same answers.

`@mcmec/ui`'s `toastOnError` finds a command refusal itself instead of importing the helper from `@mcmec/sync`.
