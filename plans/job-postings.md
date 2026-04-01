# Plan: Job Postings — Public Listings & HR Management

> Source PRD: [thebigthing313/mcmec-apps#84](https://github.com/thebigthing313/mcmec-apps/issues/84)

## Architectural decisions

Durable decisions that apply across all phases:

- **Routes (Public)**: `/about/job-opportunities` (listing), `/about/job-opportunities/$postingId` (detail)
- **Routes (HR)**: `/(app)/job-postings/` (list), `/(app)/job-postings/$postingId` (detail), `/(app)/job-postings/$postingId_.edit` (edit), add dialog for creation
- **Schema**: `job_postings` table — `id` (UUID PK), `title` (text, not null), `content` (JSONB, TipTap document), `published_at` (timestamptz, nullable — null = draft), `is_closed` (boolean, default false), standard audit fields (`created_at`, `created_by`, `updated_at`, `updated_by`)
- **RLS**: Public can `SELECT` where `published_at <= now() AND is_closed = false`. HR users get full CRUD via existing `manage_employees` permission through `has_permission()`.
- **Derived status**: No status column. Status computed from `published_at` and `is_closed`: `is_closed = true` → Closed, `published_at = null` → Draft, `published_at > now()` → Pending, otherwise → Published.
- **Auth**: No new permissions. HR app already gated by `manage_employees` permission in the `/(app)` layout route guard.
- **Collection type**: Eager collection for HR app (small dataset, real-time updates needed).
- **Rich text**: TipTap content stored as JSONB. Edited via existing `ContentField` component (`@mcmec/ui/forms/content-field`), rendered via existing `TiptapRenderer` (`@mcmec/ui/blocks/tiptap-renderer`).

---

## Phase 1: Database & Schema Foundation

**User stories**: 4, 11 (partial)

### What to build

Create the `job_postings` table end-to-end through the database layer: schema definition, migration, RLS policies, audit trigger, Zod validation schemas, and TanStack DB collection. After this phase, the HR app can programmatically read/write job postings and the public-facing query will correctly filter to only visible postings — but no UI exists yet.

### Acceptance criteria

- [ ] Schema definition exists in `supabase/schemas/` following existing conventions
- [ ] Migration creates `job_postings` table with all columns, audit trigger, and RLS policies
- [ ] `supabase db reset` runs cleanly with the new migration
- [ ] Database types regenerated (`pnpm gen-types`) and reflect the new table
- [ ] Zod schemas (`JobPostingsRowSchema`, `JobPostingsInsertSchema`, `JobPostingsUpdateSchema`) defined in `packages/supabase/src/db/`
- [ ] Eager collection for `job_postings` added to HR collections
- [ ] RLS correctly restricts public reads to published + not-closed postings
- [ ] RLS correctly allows full CRUD for users with `manage_employees` permission

---

## Phase 2: HR App — Job Postings CRUD

**User stories**: 4, 5, 6, 7, 8, 9, 11, 13

### What to build

Full CRUD interface in the HR app for managing job postings. HR staff can create new postings with a title and rich text content (TipTap editor), set a `published_at` date (including future dates for scheduled publishing), toggle `is_closed` to unlist postings, and edit existing postings. The list view shows all postings with their derived status (draft/pending/published/closed) as badges. Detail view renders the TipTap content read-only. A sidebar nav entry provides access to the section.

### Acceptance criteria

- [ ] "Job Postings" entry added to the HR app sidebar navigation
- [ ] List page at `/(app)/job-postings/` shows all postings with title, derived status badge, `published_at` date
- [ ] List page supports sorting and pagination following the employees list pattern
- [ ] Add dialog creates a new posting with title, content (TipTap editor), `published_at` date picker, and `is_closed` toggle
- [ ] Detail page at `/(app)/job-postings/$postingId` renders posting info read-only with TipTap content displayed via `TiptapRenderer`
- [ ] Edit page at `/(app)/job-postings/$postingId_.edit` allows modifying all fields with the same form components
- [ ] Status badges correctly reflect: Draft (no `published_at`), Pending (`published_at` in future), Published (`published_at` in past, not closed), Closed (`is_closed = true`)
- [ ] All routes are protected by the existing `/(app)` layout permission guard — no additional auth logic needed
- [ ] App builds cleanly and type-checks

---

## Phase 3: Public App — Careers Pages

**User stories**: 1, 2, 3, 12

### What to build

Public-facing careers section on the MCMEC website. A listing page at `/about/job-opportunities` shows all currently visible job postings (published and not closed) with titles and posted dates, linking to individual detail pages. Detail pages render the full TipTap content. Direct URLs to closed, draft, or nonexistent postings return a 404. A navbar entry under the "About" section provides navigation. Data is fetched via TanStack Start server functions with SSR, following the existing notices pattern.

### Acceptance criteria

- [ ] Server function and query options added for fetching visible job postings (RLS handles filtering)
- [ ] Listing page at `/about/job-opportunities` renders published, non-closed postings with title and posted date
- [ ] Each posting links to its detail page
- [ ] Detail page at `/about/job-opportunities/$postingId` renders full TipTap content via `TiptapRenderer`
- [ ] Detail page loader throws `notFound()` for missing, closed, or unpublished postings
- [ ] "Job Opportunities" entry added to the navbar under the "About" dropdown
- [ ] Pages are server-side rendered (SSR) via TanStack Start
- [ ] App builds cleanly and type-checks

---

## Phase 4: Unit Tests

**User stories**: N/A (quality assurance)

### What to build

Unit tests for the job postings data layer. Test the Zod validation schemas to ensure they accept valid inputs and reject invalid ones, with edge cases around nullable `published_at` and JSONB `content`. If a posting visibility/status derivation helper is extracted, test it thoroughly — given combinations of `published_at` (null, past, future) and `is_closed` (true/false), assert the correct derived status.

### Acceptance criteria

- [ ] Zod schema tests: valid job posting data passes, invalid data (missing title, bad content shape, etc.) is rejected
- [ ] Edge case tests for `published_at`: null (draft), past date, future date, exact boundary
- [ ] Status derivation helper tested: all combinations of `published_at` and `is_closed` produce correct status strings
- [ ] Tests run via `pnpm --filter @mcmec/supabase test:run` (or whichever package the schemas live in)
- [ ] Tests added to CI workflow

---

## Phase 5: Playwright E2E Infrastructure & Tests

**User stories**: N/A (quality assurance, infrastructure)

### What to build

Establish Playwright as the E2E testing framework for the monorepo and write the first E2E tests against the job postings feature. This sets the pattern for all future E2E tests. Infrastructure includes Playwright config at the repo root, an `e2e/` test directory, browser installation, and a new CI workflow job. Tests cover the public careers pages (listing loads, detail renders, closed postings 404) and the HR app CRUD lifecycle (create posting, verify in list, edit, close).

### Acceptance criteria

- [ ] `@playwright/test` added as a root devDependency
- [ ] `playwright.config.ts` at repo root configured for local dev server targets (public app port 3000, HR app port TBD)
- [ ] `e2e/` directory at repo root with test files
- [ ] Public site E2E: careers listing page loads and displays published postings
- [ ] Public site E2E: detail page renders posting content
- [ ] Public site E2E: direct URL to closed/unpublished posting returns 404
- [ ] HR app E2E: create a posting via add dialog, verify it appears in list
- [ ] HR app E2E: edit a posting, verify changes persist
- [ ] HR app E2E: close a posting, verify status updates in list
- [ ] New CI workflow job installs Playwright browsers and runs E2E tests
- [ ] CI job runs on PRs to `develop` and `main`
