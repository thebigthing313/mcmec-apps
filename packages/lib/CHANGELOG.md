# @mcmec/lib

## 0.9.0

### Minor Changes

- d1cc9c7: Serve the shared brand images from Railway instead of Supabase Storage. This removes the last runtime dependency on Supabase in the frontends.

  **api** — the nine images (logos, favicon, hero, the 404 illustration) are committed to `apps/api/assets/` and served at `/assets/<filename>` with `Cache-Control: public, max-age=31536000, immutable`, carried over byte-for-byte from what the Supabase upload set. `api` gets the job because it is the only always-on service present in both environments, which preserves the one thing the bucket was buying: a single canonical origin, so all six apps share one copy and one browser cache entry.

  The directory is read once at boot into memory (~2 MB). That keeps a caller-supplied path from ever reaching the filesystem, so traversal is unreachable by construction rather than by validation, and it makes a content-hash `ETag` free — a client that revalidates despite `immutable` gets a 304 instead of 2 MB. The route sits outside `/api/*` and so outside the CORS middleware, deliberately: `<img>` and `<link rel="icon">` loads are not CORS-gated.

  **@mcmec/lib** — `constants/assets` now points at the API origin. It stays hardcoded to production in every environment, including local dev: the bytes are identical everywhere, so this gives one shared cache and adds no build variable a service could be provisioned without — and `public` could not read such a variable anyway, since its API origin is deliberately server-side only.

  Because the filenames are unversioned and served `immutable`, changing an image now requires a **new filename** in both `apps/api/assets/` and `constants/assets`. Overwriting in place will look correct on a fresh browser and stay stale for a year on every returning one.

  **public** — `img-src` drops `https://*.supabase.co` for the API origin, completing the CSP cleanup Phase 4 left open.

  Also removed `scripts/upload-assets-to-storage.ts`, which was the only writer to the bucket. Publishing an image is now a commit.

- 76ce7e8: Railway migration Phase 4 — rewire the `admin` app to the new backend.

  **admin** — auth moves to the Better Auth cookie client (`makeAuthClient(VITE_API_URL)`); the router context carries `authClient` instead of a Supabase client, and the app now self-hosts its own `/login` (one shared session cookie does SSO across apps, so there is no cross-app redirect hub). The `(app)` guard verifies `manage_users` (renamed from `admin_rights`) and redirects unauthenticated users to the local login with a same-origin-only `redirect` param. Employee data reads through the ElectricSQL `employees` collection and writes through `/api/data/employees`. Manage Permissions is rebuilt on Better Auth roles: users are read via the admin plugin and role sets are full-replaced through `PUT /api/users/:id/roles`, with a guard against revoking your own `manage_users`. Invites now `POST /api/invite` (extracted into a shared `InviteButton` that surfaces failures and a login-created-but-email-failed result) instead of calling a Supabase edge function. Requires `VITE_API_URL`.

  **@mcmec/lib** — new `constants/roles` module exporting `APP_ROLES`, the `AppRole` union, display labels, and a `parseRoles` helper for Better Auth's comma-separated `users.role`; app definitions renamed their required permissions (`public_notices`→`manage_website`, `admin_rights`→`manage_users`) and now type them as `AppRole`.

### Patch Changes

- cf2e2aa: Make the app switcher environment-aware. It decided production by testing whether the hostname
  merely _contained_ `middlesexmosquito.org`, which is true on the staging siblings too — so every
  switcher link on `*-staging.middlesexmosquito.org` pointed at production, silently walking a
  staging session into live data. The environment is now derived from the subdomain label left of
  the root domain, so staging links to staging and production to production with no per-service
  configuration to forget.

  Local dev links now use the Caddy https ports (3444–3447) instead of the raw Vite upstreams. An
  `http://` page calling the `https://` API is cross-site under schemeful same-site, so the session
  cookie was withheld and switching apps in dev bounced straight to `/login`.

- 76ce7e8: Rename the `notices` app to `website-management`.

  The app long ago outgrew its name — it manages every kind of content published on the public website (notices, meetings, insecticides, spray schedules, documents, service requests, weekly activity), not just notices. The workspace package and directory are now `website-management`, the UI calls it "Website Management", and the dev server moved from port 3002 to 3006 (3002 collides with other local tooling).

  The `notices` domain itself is unchanged — the `notices` table, its collections, and the public site's `/notices` routes keep their names.

  **Deployment follow-up:** the production subdomain moves `notices.middlesexmosquito.org` → `website.middlesexmosquito.org` (declared in `@mcmec/lib`'s app registry and the API's `TRUSTED_ORIGINS`), and the Vercel project's root directory must be repointed at `apps/website-management`.

## 0.8.0

### Minor Changes

- b37462b: Add job postings feature with HR management CRUD and public careers pages

## 0.7.3

### Patch Changes

- b9b91e2: Centralize login through central app with branded auth layout. PKCE flow with shared cookie domain for production, hash fragment tokens for local dev. Add processAuthRedirect and getCentralLoginUrl helpers.

## 0.7.2

### Patch Changes

- 187f5d9: Add Admin app for managing user permission assignments. Add admin_rights permission. Add user_permissions audit fields and RLS policies. Update app registry with Admin app entry.
- 95e01c3: Move shared assets to Supabase Storage. Remove packages/assets, sync-assets build step, and shx dependency. Apps now import asset URLs from @mcmec/lib/constants/assets.
- 501ef75: Add HR app for employee management with employees CRUD, invite flow, and TanStack Table. Update app registry with cross-app URLs. Fix layout logo to use Supabase Storage. Add employees RLS policies and manage_employees permission. Add TanStack DB skill mappings to CLAUDE.md.

## 0.7.1

### Patch Changes

- a8b88f5: New @mcmec/auth package with typed errors, canonical Claims type, and dependency injection pattern. Update PasswordSchema minimum from 8 to 6 characters.

## 0.7.0

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

## 0.6.3

### Patch Changes

- 43306d2: 📱 Public App (apps/public)
  Notice System: Added legal notice descriptions, improved feed layouts, and added an archive view. (Fixes #20)
  Meetings Page: Introduced year-based filtering and a revamped layout for better readability. (Fixes #27, #26)
  Navigation: Enhanced the mobile navigation bar layout and integrated the official logo.
  SEO & Content: Updated heading levels for better accessibility and SEO on the "How We Control Mosquitoes" page.
  Cleanup: Removed the unused scroll indicator component from the homepage.

  ✍️ Notices Management App (apps/notices)
  Form Validation: significantly enhanced validation logic across all forms (Notices, Meetings, and Insecticides) with more descriptive error messages. (Fixes #3)
  Security: Updated title fields to require a minimum of 5 characters to prevent low-quality entries.
  Tables: Added visual sort indicators to all data columns for easier navigation.

  🛠️ UI Component Library (packages/ui)
  Table Enhancements: Implemented column sort indicators for the Meetings and Insecticides tables.
  Mobile UI: Updated the mobile list view for meetings.
  Layouts: Refined the root layout and "Not Found" error pages.

  🏗️ Central App & Core Library (apps/central | packages/lib)
  Asset Management: Streamlined how images and files are handled; removed several unused asset URLs and updated global constants. (Fixes #22)
  Shared Logic: Updated centralized error constants and validation schemas to support the new form requirements.

## 0.6.2

### Patch Changes

- 519868d: Public Meetings Dashboard: A new dedicated section for viewing and managing meeting data, accessible via the main navigation.
  Meeting Management Tools: Introduced streamlined forms and workflows to create, edit, and organize meeting details.
  Mobile-Optimized Views: Added a responsive interface including a new mobile-friendly list view for meetings on the go.
  Improved Date/Time Formatting: Meetings now display in localized formats with proper timezone support.
  Refined Navigation: Updated breadcrumbs and menus for more intuitive browsing.
  Stability Fixes: Improved error handling for missing records and resolved a display issue within text input fields.

## 0.6.1

### Patch Changes

- d00a319: Applied Middlesex County styling guidelines and web/mobile layouts for the public website.
- fb040ad: Created footer for public website.

## 0.6.0

### Minor Changes

- 3f9666d: Created date functions and refactored all date displays in apps to properly render.
