# admin

## 0.4.0

### Minor Changes

- 76ce7e8: Railway migration Phase 4 — rewire the `admin` app to the new backend.

  **admin** — auth moves to the Better Auth cookie client (`makeAuthClient(VITE_API_URL)`); the router context carries `authClient` instead of a Supabase client, and the app now self-hosts its own `/login` (one shared session cookie does SSO across apps, so there is no cross-app redirect hub). The `(app)` guard verifies `manage_users` (renamed from `admin_rights`) and redirects unauthenticated users to the local login with a same-origin-only `redirect` param. Employee data reads through the ElectricSQL `employees` collection and writes through `/api/data/employees`. Manage Permissions is rebuilt on Better Auth roles: users are read via the admin plugin and role sets are full-replaced through `PUT /api/users/:id/roles`, with a guard against revoking your own `manage_users`. Invites now `POST /api/invite` (extracted into a shared `InviteButton` that surfaces failures and a login-created-but-email-failed result) instead of calling a Supabase edge function. Requires `VITE_API_URL`.

  **@mcmec/lib** — new `constants/roles` module exporting `APP_ROLES`, the `AppRole` union, display labels, and a `parseRoles` helper for Better Auth's comma-separated `users.role`; app definitions renamed their required permissions (`public_notices`→`manage_website`, `admin_rights`→`manage_users`) and now type them as `AppRole`.

### Patch Changes

- 8ed561d: Make the frontends deployable on Railway.

  Vercel supplied two things these apps silently depended on: a static file server with an SPA
  rewrite, and a build pipeline that knew which app it was building. A Railway service supplies
  neither — it gives you a container and runs your start command. Nothing here could boot.

  **Static serving.** The four SPAs gain `sirv-cli` as a runtime dependency and a start script,
  `sirv dist --single --etag --host 0.0.0.0`. `--single` restores the SPA fallback, without which
  every deep link 404s on refresh. `--host 0.0.0.0` is not optional: `sirv-cli` defaults `--host`
  to `localhost`, so the container would bind loopback and Railway would return 502 with the
  process apparently healthy. It is a regular dependency rather than a devDependency because the
  production install prunes devDependencies.

  **`public`'s start script was broken.** It pointed at `dist/server/server.js` via a `pnpx srvx`
  invocation, but the build emits `.output/server/index.mjs` and `srvx` was never a dependency.
  `pnpm --filter public start` failed on any machine; nothing had run it, so it went unnoticed and
  would have failed on the first SSR deploy. It is now `node .output/server/index.mjs`.

  **Per-service config.** Each app carries `apps/<app>/railway.json` with its own build command,
  start command and watch patterns. This matters because the repo-root `railway.json` belongs to
  `api` and starts with `db:migrate` — any service rooted at the repo root without an explicit
  config path would read it and try to boot the API.

  **Cookie namespacing.** `COOKIE_PREFIX` now namespaces the session cookie. Staging hosts are
  siblings of production under the same parent domain, and the SSO cookie is scoped to that
  shared parent, so without distinct prefixes both environments write the same cookie name at
  the same scope: signing into staging would clobber a production session and vice versa, and
  each API would then receive the other environment's token and reject it. Left alone that
  presents as sporadic unexplained logouts rather than as an error. Unset falls back to Better
  Auth's default, which is correct for local dev.

  `docs/railway-deployment.md` records the topology, per-service settings, build-time variable
  rules, the domain and cookie table, and the dashboard-only steps.

- 76ce7e8: Railway migration Phase 4 — rewire the `hr` and `central` apps to the new backend.

  **hr** — Better Auth cookie client, its own `/login`, and the `(app)` guard verifying `manage_employees` against the auth client instead of a Supabase session. Employees and job postings read through ElectricSQL collections and write through the Hono API; the removed `created_by`/`updated_by` columns are gone from both insert paths. Requires `VITE_API_URL`.

  **central** — same auth wiring, plus the four screens it owns as the employee portal:
  - **Sign in** calls Better Auth and no longer hands sibling apps a session. The old dev-only trick of appending access and refresh tokens to the redirect URL in a hash fragment is deleted — one cookie is shared across every app now — and the redirect param is restricted to same-origin paths.
  - **Forgot password** requests a Better Auth reset email.
  - **Reset password** and **set password** both complete the tokenized reset, reading `?token=` from the URL. Setting a password no longer signs you in, so both finish at sign-in.

  **@mcmec/ui** — new `blocks/invite-button`. HR and admin each had their own copy (HR's still called the deleted Supabase edge function); they now share one that takes `apiUrl`, posts to `/api/invite`, surfaces failures, and distinguishes a login created with a failed invite email.

- f609219: Keep every deployment except the production public site out of search results.

  `public` sets `X-Robots-Tag: noindex, nofollow` from a Nitro response hook and serves a
  `Disallow: /` robots.txt whenever it is not production, so staging cannot be indexed as a
  duplicate of the Commission's official channel for legal notices. The switch asks whether the
  environment _is_ production rather than whether it is staging, so a service missing its
  configuration declines to be indexed instead of quietly appearing in search results.

  The four staff apps carry a `noindex` meta tag and a `Disallow: /` robots.txt in every
  environment — they have no public audience anywhere.

- Updated dependencies [cf2e2aa]
- Updated dependencies [d1cc9c7]
- Updated dependencies [76ce7e8]
- Updated dependencies [76ce7e8]
- Updated dependencies [76ce7e8]
- Updated dependencies [76ce7e8]
- Updated dependencies [76ce7e8]
- Updated dependencies [76ce7e8]
- Updated dependencies [76ce7e8]
- Updated dependencies [76ce7e8]
- Updated dependencies [76ce7e8]
  - @mcmec/lib@0.9.0
  - @mcmec/supabase@2.0.0
  - @mcmec/auth@0.4.0
  - @mcmec/ui@1.6.0
  - @mcmec/supabase-tanstack-db-integration@0.3.0

## 0.3.4

### Patch Changes

- Updated dependencies [803e1f7]
  - @mcmec/ui@1.5.2

## 0.3.3

### Patch Changes

- Updated dependencies [c45311a]
  - @mcmec/ui@1.5.1
  - @mcmec/supabase@1.7.1

## 0.3.2

### Patch Changes

- Updated dependencies [705816d]
- Updated dependencies [744da27]
- Updated dependencies [74f924d]
- Updated dependencies [d7980a2]
  - @mcmec/ui@1.5.0
  - @mcmec/supabase@1.7.0

## 0.3.1

### Patch Changes

- Updated dependencies [b37462b]
  - @mcmec/supabase@1.6.0
  - @mcmec/lib@0.8.0
  - @mcmec/auth@0.3.1
  - @mcmec/ui@1.4.5

## 0.3.0

### Minor Changes

- 0f84145: Fix auth loop in admin/HR apps, improve public nav bar, and resolve various issues.
  - fix(admin,hr): use shared cookie storage client to fix cross-subdomain auth loop (#80)
  - feat(admin): add employee management (list, view, edit, delete, invite) (#69)
  - fix(public): replace NavigationMenu with Popover for click-based nav and correct positioning (#78, #33)
  - feat(public): move transparency page under /notices routes (#77)
  - fix(public): add img-src and connect-src for Supabase to CSP headers (#76)
  - fix(notices): rename "Categories" to "Notice Categories" in sidebar (#79)
  - feat(notices): add pending notices section to dashboard (#15)
  - fix(supabase): use z.coerce.date<Date>() for proper Date typing in all schemas (#65)
  - fix(ui): auto-prefix https:// on tiptap editor links (#5)
  - refactor: create collection factories in @mcmec/supabase for central, admin, and HR
  - fix: display real employee name/title in sidebar user button for all apps

### Patch Changes

- Updated dependencies [0f84145]
  - @mcmec/supabase@1.5.0
  - @mcmec/ui@1.4.4

## 0.2.1

### Patch Changes

- b9b91e2: Centralize login through central app with branded auth layout. PKCE flow with shared cookie domain for production, hash fragment tokens for local dev. Add processAuthRedirect and getCentralLoginUrl helpers.
- Updated dependencies [b9b91e2]
- Updated dependencies [1a77b67]
- Updated dependencies [8dc9b46]
- Updated dependencies [5c3f9fd]
  - @mcmec/auth@0.3.0
  - @mcmec/lib@0.7.3
  - @mcmec/supabase@1.4.0
  - @mcmec/supabase-tanstack-db-integration@0.2.1
  - @mcmec/ui@1.4.3

## 0.2.0

### Minor Changes

- 187f5d9: Add Admin app for managing user permission assignments. Add admin_rights permission. Add user_permissions audit fields and RLS policies. Update app registry with Admin app entry.

### Patch Changes

- Updated dependencies [187f5d9]
- Updated dependencies [95e01c3]
- Updated dependencies [501ef75]
- Updated dependencies [9e06271]
  - @mcmec/lib@0.7.2
  - @mcmec/supabase@1.3.1
  - @mcmec/ui@1.4.2
  - @mcmec/supabase-tanstack-db-integration@0.2.0
  - @mcmec/auth@0.2.1
