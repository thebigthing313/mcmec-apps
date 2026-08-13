# @mcmec/collections

## 0.3.0

### Minor Changes

- 76ce7e8: Railway migration Phase 4 — rewire the `public` site to the new backend. This completes the frontend migration.

  **public** — every read now comes from the API's ElectricSQL shape proxy instead of Supabase, and the four intake forms post to the merged public-requests endpoint.

  The site stays server-rendered: reads still run inside TanStack Start server functions, so the data is in the SSR response rather than waiting on a client fetch, and the exported `*QueryOptions` are unchanged — no route touched them. Reading anonymously also means the shape proxy applies the public policy server-side, so unpublished notices, documents, and job postings never reach the process. Spray schedules were a nested PostgREST select; shapes are per-table, so the four shapes are read in parallel and joined in the handler.

  The four submit functions collapse into one that forwards to `POST /api/requests`, which owns the honeypot, Turnstile verification, per-type validation and the insert. Forwarding server-side (rather than posting from the browser) keeps the site talking only to its own origin — no CORS, nothing added to the CSP — and the Turnstile secret now lives only in the API. The visitor's IP is passed through so Turnstile still scores the real client.

  Removed: both Supabase clients, the local Turnstile validator, and `@supabase/ssr` / `@supabase/supabase-js`. `connect-src https://*.supabase.co` is dropped from the CSP; `img-src` keeps it until the brand assets are rehosted. Needs `API_URL` server-side, and no longer needs the Supabase or Turnstile-secret variables.

  **@mcmec/supabase** — the public intake contract, shared by the site and mirroring what the API validates: a `requestType` discriminated union of submission payloads, plus the flat form schemas the site's fields bind to and a helper mapping the contact block into a payload.

  **@mcmec/supabase-tanstack-db-integration** — new `fetchShapeSnapshot`: a one-shot shape read for callers that want current rows rather than a live collection. It waits for the shape to report up-to-date, then aborts the stream so no long-poll outlives an SSR request, and applies the same parser the collections use so server and client rows agree.

### Patch Changes

- 76ce7e8: Let on-demand collections sync through the shape proxy.

  On-demand syncing sends `log=changes_only` plus `subset__where` / `subset__order_by` / `subset__params` to pull slices rather than whole tables, and the proxy forwarded only its sync-cursor allowlist. The dropped params didn't fail loudly — the collection simply synced nothing, so the 178-row public-requests table rendered as "0 of 0".

  The proxy now forwards `log` and any `subset__*` param. That's safe because Electric intersects a subset with the shape's own `where` instead of replacing it: verified against staging, a shape pinned to `status = 'resolved'` returned zero rows for `subset__where: status = 'new'` while such a row existed, and `subset__where: true = true` still returned only the resolved set. A client cannot reach rows the policy excludes.

  `public_requests` and `mosquito_activity_data` stay on-demand as intended — both only grow, and pulling them whole on every page load doesn't scale.

- 76ce7e8: Stop a slow sync from rolling back a committed write.

  The collection handlers returned `{ txid }`, which handed the settle wait to
  `@tanstack/electric-db-collection`. Its `processMatchingStrategy` calls `awaitTxId` with a 5
  second default, and that call **rejects** on timeout. The rejection propagates out of the
  mutation handler, so the transaction is marked failed and the optimistic state rolls back —
  the user watches their edit disappear from the screen while Postgres has it durably committed.

  Five seconds is comfortable against a local API, but the production path is longer, and a
  cold start on a sleeping Serverless service could plausibly exceed it. A write vanishing from
  the UI is the worst possible way to report "sync was briefly slow."

  The API's 2xx response is the durability signal: `handleWrite` throws on any non-2xx, so
  genuine failures still reject and still roll back exactly as before. Only the lag case
  changes. Each handler now awaits its own txids, with a 30 second window, and swallows a
  timeout rather than failing the mutation — then returns a result with no `txid` key so the
  collection does not wait a second time (its check keys off that property's presence).

  In the normal case the optimistic overlay persists until the real row arrives, so there is no
  flicker. If the window is exceeded, the overlay drops and the row shows its last synced value
  until the collection converges — a brief flicker instead of a lost edit, and a console warning
  naming the collection.

## 0.2.1

### Patch Changes

- 5c3f9fd: Add service requests and contact submissions management to the notices app
  - Add on-demand collections for adult mosquito complaints, mosquitofish requests, water management requests, and contact form submissions
  - Add full CRUD routes for all 3 service request types and contact submissions with detail, edit, and create pages
  - Restyle dashboard with stat cards, pending requests, open submissions, recent notices, and meetings
  - Add mutation error toasts via TanStack DB isPersisted — only shown when server rejects and optimistic state rolls back
  - Fix useNotices join duplication bug causing cartesian products with employee left join
  - Fix on-demand collection queryKey prefix validation warnings
  - Replace table cell links with clickable rows using navigate

## 0.2.0

### Minor Changes

- 9e06271: Add supabase-tanstack-db-integration package. Bridges TanStack DB with Supabase for reactive collections with optimistic mutations.
