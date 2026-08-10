---
"central": major
"hr": major
"@mcmec/ui": minor
"admin": patch
---

Railway migration Phase 4 — rewire the `hr` and `central` apps to the new backend.

**hr** — Better Auth cookie client, its own `/login`, and the `(app)` guard verifying `manage_employees` against the auth client instead of a Supabase session. Employees and job postings read through ElectricSQL collections and write through the Hono API; the removed `created_by`/`updated_by` columns are gone from both insert paths. Requires `VITE_API_URL`.

**central** — same auth wiring, plus the four screens it owns as the employee portal:

- **Sign in** calls Better Auth and no longer hands sibling apps a session. The old dev-only trick of appending access and refresh tokens to the redirect URL in a hash fragment is deleted — one cookie is shared across every app now — and the redirect param is restricted to same-origin paths.
- **Forgot password** requests a Better Auth reset email.
- **Reset password** and **set password** both complete the tokenized reset, reading `?token=` from the URL. Setting a password no longer signs you in, so both finish at sign-in.

**@mcmec/ui** — new `blocks/invite-button`. HR and admin each had their own copy (HR's still called the deleted Supabase edge function); they now share one that takes `apiUrl`, posts to `/api/invite`, surfaces failures, and distinguishes a login created with a failed invite email.
