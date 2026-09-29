# @mcmec/auth

## 0.5.0

### Minor Changes

- 0e59af0: Central becomes the shell for every staff App. Its root signed-in layout owns the frame, the app switcher, NavUser and the breadcrumb, and reads the claims and the Employee row once. Each App's layout route supplies only its `activeApp` and rail in `staticData`, plus a synchronous `requireAppRole(context.claims, role)` gate. A deep link into an App the User lacks keeps its URL and shows `AppRoleRequired` inside the shell, with the Self Service Portal's rail. A User with no linked Employee is refused full-page at the root. `/`, `/notices` and `/meetings` are now the Self Service Portal, and central gets route tests that are table-driven over the App list.

  `@mcmec/lib`: the App list names the Self Service Portal (the `Central` AppName is gone), and an App folded into central has a path as its `href`.

  `@mcmec/ui`: `AppRoleRequired` drops `centralUrl` for `to` plus an optional `LinkComponent`, and its action reads "Go to the Self Service Portal". `OnboardingRequired` is renamed `EmployeeRequired`, and both notices' remedy copy names Admin and HR as Apps. The app switcher takes an optional `LinkComponent` for in-app Apps and drops its dropdown when only one App is accessible.

  `@mcmec/auth`: `NotOnboardedError` is renamed `NoEmployeeError` (code `NO_EMPLOYEE`), and the new `readClaims` reads the session without applying policy. `verifyClaims` behaves as before.

### Patch Changes

- Updated dependencies [05d64c3]
- Updated dependencies [0e59af0]
- Updated dependencies [fa28784]
- Updated dependencies [e6c8ad5]
- Updated dependencies [afc64ff]
- Updated dependencies [50c8b1f]
  - @mcmec/lib@0.11.0

## 0.4.2

### Patch Changes

- Updated dependencies [0e49037]
- Updated dependencies [62f332a]
- Updated dependencies [9b0ea3c]
- Updated dependencies [30bef37]
- Updated dependencies [9f288ec]
- Updated dependencies [30bef37]
- Updated dependencies [0e49037]
- Updated dependencies [d00dfe1]
- Updated dependencies [e6877ea]
- Updated dependencies [3b8822d]
- Updated dependencies [4515e79]
- Updated dependencies [8381e83]
- Updated dependencies [ab92401]
- Updated dependencies [0e49037]
- Updated dependencies [62f332a]
- Updated dependencies [efc7409]
- Updated dependencies [51aef15]
  - @mcmec/lib@0.10.0

## 0.4.1

### Patch Changes

- Updated dependencies [cae7305]
  - @mcmec/lib@0.9.1

## 0.4.0

### Minor Changes

- 76ce7e8: Railway migration Phase 3 — rewire the shared frontend packages to the new backend (breaking; apps are wired in Phase 4).

  **@mcmec/auth** — swap Supabase Auth for a Better Auth client. New `@mcmec/auth/client` factory (`makeAuthClient(baseURL)`); `signIn`/`signOut`/`verifyClaims` now take that client instead of a `SupabaseClient` and read `GET /api/auth/get-session`. `handleCrossAppAuth` is a no-op (SSO is cookie-based now). Errors/types/subpaths unchanged.

  **@mcmec/supabase-tanstack-db-integration** (private) — reads now stream from the ElectricSQL shape proxy (`/api/shapes/:table`) via `@tanstack/electric-db-collection`; writes go through `POST/PATCH/DELETE /api/data/:table` (credentialed, snake_case→camelCase), returning the Postgres `txid` for optimistic reconciliation. PostgREST CRUD + predicate pushdown removed.

  **@mcmec/supabase** — collection factories now take `{ apiUrl }` instead of `{ supabase, queryClient }`; `./client` export removed. Schema deltas: audit columns (`created_by`/`updated_by`) dropped from the row schemas; the four intake tables collapse into one `public_requests` schema/collection; `permissions`/`user_permissions` removed (now Better Auth roles).

  **api** — the write endpoints (`/api/data/*`, `/api/users/:id/roles`, `/api/mosquito-activity/import`, `/api/spray-schedules/:id/municipalities`) now return the transaction `txid` so Electric collections can settle optimistic mutations.

### Patch Changes

- Updated dependencies [cf2e2aa]
- Updated dependencies [d1cc9c7]
- Updated dependencies [76ce7e8]
- Updated dependencies [76ce7e8]
  - @mcmec/lib@0.9.0

## 0.3.1

### Patch Changes

- Updated dependencies [b37462b]
  - @mcmec/lib@0.8.0

## 0.3.0

### Minor Changes

- b9b91e2: Centralize login through central app with branded auth layout. PKCE flow with shared cookie domain for production, hash fragment tokens for local dev. Add processAuthRedirect and getCentralLoginUrl helpers.

### Patch Changes

- 8dc9b46: Migrate notices app to supabase-tanstack-db-integration via collection factory in @mcmec/supabase. Remove individual collection files, add unified db.ts with getDb()/useDb() singleton pattern. Remove fetch functions and SupabaseClient imports from schema files (pure Zod). Deduplicate supabase-js and react-router versions via pnpm overrides. Align supabase-js to ^2.100.1 across all packages.
- Updated dependencies [b9b91e2]
  - @mcmec/lib@0.7.3

## 0.2.1

### Patch Changes

- Updated dependencies [187f5d9]
- Updated dependencies [95e01c3]
- Updated dependencies [501ef75]
  - @mcmec/lib@0.7.2

## 0.2.0

### Minor Changes

- a8b88f5: New @mcmec/auth package with typed errors, canonical Claims type, and dependency injection pattern. Update PasswordSchema minimum from 8 to 6 characters.

### Patch Changes

- Updated dependencies [a8b88f5]
  - @mcmec/lib@0.7.1
