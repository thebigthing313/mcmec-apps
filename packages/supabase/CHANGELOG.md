# @mcmec/supabase

## 2.0.1

### Patch Changes

- Updated dependencies [cae7305]
  - @mcmec/lib@0.9.1

## 2.0.0

### Major Changes

- 76ce7e8: Railway migration Phase 3 — rewire the shared frontend packages to the new backend (breaking; apps are wired in Phase 4).

  **@mcmec/auth** — swap Supabase Auth for a Better Auth client. New `@mcmec/auth/client` factory (`makeAuthClient(baseURL)`); `signIn`/`signOut`/`verifyClaims` now take that client instead of a `SupabaseClient` and read `GET /api/auth/get-session`. `handleCrossAppAuth` is a no-op (SSO is cookie-based now). Errors/types/subpaths unchanged.

  **@mcmec/supabase-tanstack-db-integration** (private) — reads now stream from the ElectricSQL shape proxy (`/api/shapes/:table`) via `@tanstack/electric-db-collection`; writes go through `POST/PATCH/DELETE /api/data/:table` (credentialed, snake_case→camelCase), returning the Postgres `txid` for optimistic reconciliation. PostgREST CRUD + predicate pushdown removed.

  **@mcmec/supabase** — collection factories now take `{ apiUrl }` instead of `{ supabase, queryClient }`; `./client` export removed. Schema deltas: audit columns (`created_by`/`updated_by`) dropped from the row schemas; the four intake tables collapse into one `public_requests` schema/collection; `permissions`/`user_permissions` removed (now Better Auth roles).

  **api** — the write endpoints (`/api/data/*`, `/api/users/:id/roles`, `/api/mosquito-activity/import`, `/api/spray-schedules/:id/municipalities`) now return the transaction `txid` so Electric collections can settle optimistic mutations.

### Minor Changes

- 76ce7e8: Railway migration Phase 4 — rewire the `public` site to the new backend. This completes the frontend migration.

  **public** — every read now comes from the API's ElectricSQL shape proxy instead of Supabase, and the four intake forms post to the merged public-requests endpoint.

  The site stays server-rendered: reads still run inside TanStack Start server functions, so the data is in the SSR response rather than waiting on a client fetch, and the exported `*QueryOptions` are unchanged — no route touched them. Reading anonymously also means the shape proxy applies the public policy server-side, so unpublished notices, documents, and job postings never reach the process. Spray schedules were a nested PostgREST select; shapes are per-table, so the four shapes are read in parallel and joined in the handler.

  The four submit functions collapse into one that forwards to `POST /api/requests`, which owns the honeypot, Turnstile verification, per-type validation and the insert. Forwarding server-side (rather than posting from the browser) keeps the site talking only to its own origin — no CORS, nothing added to the CSP — and the Turnstile secret now lives only in the API. The visitor's IP is passed through so Turnstile still scores the real client.

  Removed: both Supabase clients, the local Turnstile validator, and `@supabase/ssr` / `@supabase/supabase-js`. `connect-src https://*.supabase.co` is dropped from the CSP; `img-src` keeps it until the brand assets are rehosted. Needs `API_URL` server-side, and no longer needs the Supabase or Turnstile-secret variables.

  **@mcmec/supabase** — the public intake contract, shared by the site and mirroring what the API validates: a `requestType` discriminated union of submission payloads, plus the flat form schemas the site's fields bind to and a helper mapping the contact block into a payload.

  **@mcmec/supabase-tanstack-db-integration** — new `fetchShapeSnapshot`: a one-shot shape read for callers that want current rows rather than a live collection. It waits for the shape to report up-to-date, then aborts the stream so no long-poll outlives an SSR request, and applies the same parser the collections use so server and client rows agree.

- 76ce7e8: Railway migration Phase 4 — rewire the `website-management` app to the new backend.

  **website-management** — auth moves to the Better Auth cookie client, with the app self-hosting its own `/login` and the `(app)` guard verifying `manage_website` (renamed from `public_notices`). All content reads stream from ElectricSQL collections and writes go through the Hono API.

  The four public-intake surfaces (adult mosquito, mosquitofish, water management, contact submissions) collapse into **one "Public Requests" section** backed by the merged `public_requests` table, with request-type and status filters, a triage view that renders each type's `details` generically, and delete. Staff-entered requests are gone: the backend accepts submissions only from the public site's Turnstile-gated intake endpoint, so the four staff create-forms were removed along with the per-type tables and edit forms.

  Spray-schedule municipality links now go through the API's junction endpoints, and the weekly-activity CSV upload posts to the bulk import endpoint — which replaces only the years present in the file instead of wiping the whole dataset, so the confirmation copy changed to match. Audit columns (`created_by`/`updated_by`) are gone from every form and the "Creator" column was dropped from the notices and documents tables. Requires `VITE_API_URL`.

  **@mcmec/supabase** — the notices collection factory gained an on-demand `mosquitoActivityData` collection so the weekly-activity charts read live instead of paging through PostgREST.

  **api** — new `GET /api/spray-schedules/municipalities` (gated `manage_website`) returning the junction rows. The junction has a composite primary key and no `id`, so it can't be an Electric collection; this is its read path.

- 76ce7e8: Give `spray_schedule_municipalities` a surrogate `id` so the junction can sync as a collection.

  **api** — migration `0003` drops the composite primary key, adds `id uuid primary key default gen_random_uuid()`, and keeps the pair unique via `spray_schedule_municipalities_pair_key`. Existing rows keep their pairs and pick up generated ids. Writes still go through `PUT /api/spray-schedules/:id/municipalities` — replacing a schedule's whole set is one transaction, not a series of row writes — but the short-lived `GET /api/spray-schedules/municipalities` added alongside it is gone, since clients now read the junction from its Electric shape.

  **@mcmec/supabase** — new `SprayScheduleMunicipalitiesRowSchema` and a read-only `sprayScheduleMunicipalities` collection in the notices factory.

  **website-management** — the spray-schedule screens read municipality links from the collection instead of polling an endpoint, so a municipality write syncs back on its own with no query invalidation.

### Patch Changes

- 76ce7e8: Let on-demand collections sync through the shape proxy.

  On-demand syncing sends `log=changes_only` plus `subset__where` / `subset__order_by` / `subset__params` to pull slices rather than whole tables, and the proxy forwarded only its sync-cursor allowlist. The dropped params didn't fail loudly — the collection simply synced nothing, so the 178-row public-requests table rendered as "0 of 0".

  The proxy now forwards `log` and any `subset__*` param. That's safe because Electric intersects a subset with the shape's own `where` instead of replacing it: verified against staging, a shape pinned to `status = 'resolved'` returned zero rows for `subset__where: status = 'new'` while such a row existed, and `subset__where: true = true` still returned only the resolved set. A client cannot reach rows the policy excludes.

  `public_requests` and `mosquito_activity_data` stay on-demand as intended — both only grow, and pulling them whole on every page load doesn't scale.

- Updated dependencies [cf2e2aa]
- Updated dependencies [d1cc9c7]
- Updated dependencies [76ce7e8]
- Updated dependencies [76ce7e8]
- Updated dependencies [76ce7e8]
- Updated dependencies [76ce7e8]
- Updated dependencies [76ce7e8]
  - @mcmec/lib@0.9.0
  - @mcmec/supabase-tanstack-db-integration@0.3.0

## 1.7.1

### Patch Changes

- c45311a: Simplify meeting documents into a single bundled link by dropping the `agenda_url` and `report_url` columns — the consolidated document now lives in `minutes_url`. Updates the notices form, the shared meetings table and mobile list, and the public meetings page to match. Also refreshes the public Job Opportunities page opener with MCMEC's mission and benefits.

## 1.7.0

### Minor Changes

- 74f924d: Add mosquito spray schedule feature with admin CRUD in notices app, public display with filters at /spray-schedule, new TimeField and MultiComboboxField UI components, and dashboard integration.
- d7980a2: Add weekly mosquito activity feature with CSV upload in notices app and recharts-powered visualization on the public site at /mosquito-surveillance/weekly-activity.

## 1.6.0

### Minor Changes

- b37462b: Add job postings feature with HR management CRUD and public careers pages

### Patch Changes

- Updated dependencies [b37462b]
  - @mcmec/lib@0.8.0

## 1.5.0

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

## 1.4.0

### Minor Changes

- b9b91e2: Centralize login through central app with branded auth layout. PKCE flow with shared cookie domain for production, hash fragment tokens for local dev. Add processAuthRedirect and getCentralLoginUrl helpers.
- 1a77b67: Add documents system, archive search, and retention warning for LFN 2026-01 compliance
  - Add document_types and documents tables with RLS policies and admin CRUD in the notices app
  - Add Document Categories management page mirroring the existing notice categories pattern
  - Add public /transparency page displaying published documents grouped by type and fiscal year
  - Add text search filter to the notice archive feed (NoticeFeed component)
  - Add inline retention warning when archiving notices posted less than 7 days ago

- 8dc9b46: Migrate notices app to supabase-tanstack-db-integration via collection factory in @mcmec/supabase. Remove individual collection files, add unified db.ts with getDb()/useDb() singleton pattern. Remove fetch functions and SupabaseClient imports from schema files (pure Zod). Deduplicate supabase-js and react-router versions via pnpm overrides. Align supabase-js to ^2.100.1 across all packages.
- 5c3f9fd: Add service requests and contact submissions management to the notices app
  - Add on-demand collections for adult mosquito complaints, mosquitofish requests, water management requests, and contact form submissions
  - Add full CRUD routes for all 3 service request types and contact submissions with detail, edit, and create pages
  - Restyle dashboard with stat cards, pending requests, open submissions, recent notices, and meetings
  - Add mutation error toasts via TanStack DB isPersisted — only shown when server rejects and optimistic state rolls back
  - Fix useNotices join duplication bug causing cartesian products with employee left join
  - Fix on-demand collection queryKey prefix validation warnings
  - Replace table cell links with clickable rows using navigate

### Patch Changes

- Updated dependencies [b9b91e2]
- Updated dependencies [5c3f9fd]
  - @mcmec/lib@0.7.3
  - @mcmec/supabase-tanstack-db-integration@0.2.1

## 1.3.1

### Patch Changes

- 187f5d9: Add Admin app for managing user permission assignments. Add admin_rights permission. Add user_permissions audit fields and RLS policies. Update app registry with Admin app entry.
- Updated dependencies [187f5d9]
- Updated dependencies [95e01c3]
- Updated dependencies [501ef75]
  - @mcmec/lib@0.7.2

## 1.3.0

### Minor Changes

- 2affcd1: Replace user_profiles table with employees table. Employees table tracks all agency staff with optional auth user linkage. Rename profiles collection/accessor to employees across supabase package and notices app. Remove avatar_url field. Regenerated database types.
- 184752c: Remove old auth functions (claims, session, signIn, signOut) from @mcmec/supabase. Auth is now handled by the dedicated @mcmec/auth package.

### Patch Changes

- Updated dependencies [a8b88f5]
  - @mcmec/lib@0.7.1

## 1.2.0

### Minor Changes

- 43272a7: 🌐 Public Application (apps/public)
  New Features & Pages
  Service Request Forms: Added dedicated forms and submission logic for Adult Mosquito, Mosquitofish, and Water Management requests.
  Contact Experience: \* Launched a new "Contact Us" page with full form handling.
  Added a "Request Success" confirmation page.
  Updated the navigation bar with clear links to the new service and contact sections.
  Meetings & Notices: Added a new Meetings route and updated navigation links for easier access to public notice archives.
  Bot Protection: Integrated Cloudflare Turnstile and "honeypot" fields across all public forms to prevent spam submissions.

  Enhancements & UI
  Visual Polish: Improved the styling of GlassCard and GlassButton components for better responsiveness and visual hierarchy.
  Form Logic: \* Enhanced zip code handling with automatic city display.
  Integrated libphonenumber-js for robust phone number validation.
  Improved browser autofill support for AutoComplete and Phone components.
  Navigation: Streamlined layout consistency across all "About" and "Contact" sub-pages.

  Bug Fixes
  Corrected broken image paths for the company logo in the header, footer, and mobile navigation.
  Fixed relative pathing issues for the favicon and mission-page images.

  📝 Notices App (apps/notices)
  Form Enhancements
  Switch Controls: Updated SwitchField in both the Notice and Meeting forms with clearer labels and better orientation for true/false states.

  Developer Maintenance: Added linting overrides for environment variable interfaces.

  🛠 Shared Packages (packages/_)
  UI Components (packages/ui)
  New Components: Added CheckboxField, CheckboxInput, TextAreaField, and TextAreaInput.
  Refinements: _ Improved PhoneInput by removing unnecessary country code logic for a cleaner interface.
  Updated FieldLegend and FieldError components for more consistent typography and error visibility.
  The SubmitFormButton now intelligently disables itself based on the form's validation state.

  Database & Backend (packages/supabase & supabase/)
  Schema Updates: Implemented new tables and schemas for adult_mosquito_complaints, water_management_requests, mosquitofish_requests, and zip_codes.
  Security: \* Updated Row Level Security (RLS) policies to require specific public permissions for form insertions.
  Cleaned up unused database fields (e.g., location_of_concern) to streamline the data model.
  Validation: Centralized validation logic for emails and phone numbers to ensure data consistency across the stack.

  Utilities (packages/lib)
  Added standard error messages for invalid phone numbers and updated validation schemas to include phone-specific logic.

### Patch Changes

- Updated dependencies [43272a7]
  - @mcmec/lib@0.7.0

## 1.1.1

### Patch Changes

- Updated dependencies [43306d2]
  - @mcmec/lib@0.6.3

## 1.1.0

### Minor Changes

- 9dc254d: 🌐 Public App (apps/public)
  New "About" Content: Added comprehensive informational pages for Mission, Leadership & Staff, How We Control Mosquitoes, and Mosquito Control Products.
  Navigation Overhaul: Enhanced the navigation bar with descriptive sub-items, a new Home link, and improved mobile accessibility (ARIA attributes).
  Insecticide Directory: Integrated a public-facing view to browse commonly used mosquito control products.

  🔔 Notices App (apps/notices)
  Admin Management: Built a full management suite for insecticides, including Create, Edit, and Delete workflows with safety confirmations.
  Sidebar Integration: Added "Insecticides" to the primary navigation for quick access to data management.
  Data Forms: Implemented specialized forms for handling complex insecticide attributes and data entry.

  🏗️ UI Package (packages/ui)
  Insecticides Table: Created a reusable, high-performance table component featuring built-in sorting and pagination.
  Styling & Polish: Integrated the Tailwind CSS Typography plugin and refined navigation menu animations.

  🗄️ Supabase & Database (packages/supabase & supabase/)
  Database Schema: Designed and deployed the insecticides table with granular attributes and secure Row Level Security (RLS) policies.
  Migration: Streamlined the data structure by removing redundant columns to focus on specific product data.
  Type Safety: Generated updated database types and fetch functions to ensure full end-to-end type safety.

- 519868d: Public Meetings Dashboard: A new dedicated section for viewing and managing meeting data, accessible via the main navigation.
  Meeting Management Tools: Introduced streamlined forms and workflows to create, edit, and organize meeting details.
  Mobile-Optimized Views: Added a responsive interface including a new mobile-friendly list view for meetings on the go.
  Improved Date/Time Formatting: Meetings now display in localized formats with proper timezone support.
  Refined Navigation: Updated breadcrumbs and menus for more intuitive browsing.
  Stability Fixes: Improved error handling for missing records and resolved a display issue within text input fields.

### Patch Changes

- Updated dependencies [519868d]
  - @mcmec/lib@0.6.2

## 1.0.2

### Patch Changes

- Updated dependencies [d00a319]
- Updated dependencies [fb040ad]
  - @mcmec/lib@0.6.1

## 1.0.1

### Patch Changes

- Updated dependencies [3f9666d]
  - @mcmec/lib@0.6.0
