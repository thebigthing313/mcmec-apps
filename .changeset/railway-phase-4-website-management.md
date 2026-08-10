---
"website-management": major
"@mcmec/supabase": minor
"api": minor
---

Railway migration Phase 4 — rewire the `website-management` app to the new backend.

**website-management** — auth moves to the Better Auth cookie client, with the app self-hosting its own `/login` and the `(app)` guard verifying `manage_website` (renamed from `public_notices`). All content reads stream from ElectricSQL collections and writes go through the Hono API.

The four public-intake surfaces (adult mosquito, mosquitofish, water management, contact submissions) collapse into **one "Public Requests" section** backed by the merged `public_requests` table, with request-type and status filters, a triage view that renders each type's `details` generically, and delete. Staff-entered requests are gone: the backend accepts submissions only from the public site's Turnstile-gated intake endpoint, so the four staff create-forms were removed along with the per-type tables and edit forms.

Spray-schedule municipality links now go through the API's junction endpoints, and the weekly-activity CSV upload posts to the bulk import endpoint — which replaces only the years present in the file instead of wiping the whole dataset, so the confirmation copy changed to match. Audit columns (`created_by`/`updated_by`) are gone from every form and the "Creator" column was dropped from the notices and documents tables. Requires `VITE_API_URL`.

**@mcmec/supabase** — the notices collection factory gained an on-demand `mosquitoActivityData` collection so the weekly-activity charts read live instead of paging through PostgREST.

**api** — new `GET /api/spray-schedules/municipalities` (gated `manage_website`) returning the junction rows. The junction has a composite primary key and no `id`, so it can't be an Electric collection; this is its read path.
