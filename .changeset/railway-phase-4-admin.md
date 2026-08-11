---
"@mcmec/lib": minor
"admin": minor
---

Railway migration Phase 4 — rewire the `admin` app to the new backend.

**admin** — auth moves to the Better Auth cookie client (`makeAuthClient(VITE_API_URL)`); the router context carries `authClient` instead of a Supabase client, and the app now self-hosts its own `/login` (one shared session cookie does SSO across apps, so there is no cross-app redirect hub). The `(app)` guard verifies `manage_users` (renamed from `admin_rights`) and redirects unauthenticated users to the local login with a same-origin-only `redirect` param. Employee data reads through the ElectricSQL `employees` collection and writes through `/api/data/employees`. Manage Permissions is rebuilt on Better Auth roles: users are read via the admin plugin and role sets are full-replaced through `PUT /api/users/:id/roles`, with a guard against revoking your own `manage_users`. Invites now `POST /api/invite` (extracted into a shared `InviteButton` that surfaces failures and a login-created-but-email-failed result) instead of calling a Supabase edge function. Requires `VITE_API_URL`.

**@mcmec/lib** — new `constants/roles` module exporting `APP_ROLES`, the `AppRole` union, display labels, and a `parseRoles` helper for Better Auth's comma-separated `users.role`; app definitions renamed their required permissions (`public_notices`→`manage_website`, `admin_rights`→`manage_users`) and now type them as `AppRole`.
