---
"public": major
"@mcmec/supabase": minor
"@mcmec/supabase-tanstack-db-integration": minor
---

Railway migration Phase 4 — rewire the `public` site to the new backend. This completes the frontend migration.

**public** — every read now comes from the API's ElectricSQL shape proxy instead of Supabase, and the four intake forms post to the merged public-requests endpoint.

The site stays server-rendered: reads still run inside TanStack Start server functions, so the data is in the SSR response rather than waiting on a client fetch, and the exported `*QueryOptions` are unchanged — no route touched them. Reading anonymously also means the shape proxy applies the public policy server-side, so unpublished notices, documents, and job postings never reach the process. Spray schedules were a nested PostgREST select; shapes are per-table, so the four shapes are read in parallel and joined in the handler.

The four submit functions collapse into one that forwards to `POST /api/requests`, which owns the honeypot, Turnstile verification, per-type validation and the insert. Forwarding server-side (rather than posting from the browser) keeps the site talking only to its own origin — no CORS, nothing added to the CSP — and the Turnstile secret now lives only in the API. The visitor's IP is passed through so Turnstile still scores the real client.

Removed: both Supabase clients, the local Turnstile validator, and `@supabase/ssr` / `@supabase/supabase-js`. `connect-src https://*.supabase.co` is dropped from the CSP; `img-src` keeps it until the brand assets are rehosted. Needs `API_URL` server-side, and no longer needs the Supabase or Turnstile-secret variables.

**@mcmec/supabase** — the public intake contract, shared by the site and mirroring what the API validates: a `requestType` discriminated union of submission payloads, plus the flat form schemas the site's fields bind to and a helper mapping the contact block into a payload.

**@mcmec/supabase-tanstack-db-integration** — new `fetchShapeSnapshot`: a one-shot shape read for callers that want current rows rather than a live collection. It waits for the shape to report up-to-date, then aborts the stream so no long-poll outlives an SSR request, and applies the same parser the collections use so server and client rows agree.
