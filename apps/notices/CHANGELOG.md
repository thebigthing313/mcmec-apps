# notices

## 0.8.0

### Minor Changes

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

- b9b91e2: Centralize login through central app with branded auth layout. PKCE flow with shared cookie domain for production, hash fragment tokens for local dev. Add processAuthRedirect and getCentralLoginUrl helpers.
- Updated dependencies [b9b91e2]
- Updated dependencies [1a77b67]
- Updated dependencies [8dc9b46]
- Updated dependencies [5c3f9fd]
  - @mcmec/auth@0.3.0
  - @mcmec/lib@0.7.3
  - @mcmec/supabase@1.4.0
  - @mcmec/ui@1.4.3

## 0.7.3

### Patch Changes

- 95e01c3: Move shared assets to Supabase Storage. Remove packages/assets, sync-assets build step, and shx dependency. Apps now import asset URLs from @mcmec/lib/constants/assets.
- Updated dependencies [187f5d9]
- Updated dependencies [95e01c3]
- Updated dependencies [501ef75]
  - @mcmec/lib@0.7.2
  - @mcmec/supabase@1.3.1
  - @mcmec/ui@1.4.2
  - @mcmec/auth@0.2.1

## 0.7.2

### Patch Changes

- 2cea2d6: Rework auth flow to use email-based invites via Resend SMTP. Replace create-account edge function with invite-employee. Add set-password, forgot-password, and reset-password pages to central. Update both apps to use @mcmec/auth package with typed errors.
- 2affcd1: Replace user_profiles table with employees table. Employees table tracks all agency staff with optional auth user linkage. Rename profiles collection/accessor to employees across supabase package and notices app. Remove avatar_url field. Regenerated database types.
- dcf90f1: Hotfix for explicit build output directory on Vercel configuration.
- Updated dependencies [a8b88f5]
- Updated dependencies [2affcd1]
- Updated dependencies [184752c]
  - @mcmec/auth@0.2.0
  - @mcmec/lib@0.7.1
  - @mcmec/supabase@1.3.0
  - @mcmec/ui@1.4.1

## 0.7.1

### Patch Changes

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

- Updated dependencies [43272a7]
  - @mcmec/supabase@1.2.0
  - @mcmec/lib@0.7.0
  - @mcmec/ui@1.4.0

## 0.7.0

### Minor Changes

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

### Patch Changes

- b5445c3: Fixed insecticides table linking.
- Updated dependencies [b5445c3]
- Updated dependencies [43306d2]
  - @mcmec/ui@1.3.1
  - @mcmec/lib@0.6.3
  - @mcmec/supabase@1.1.1

## 0.6.0

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

- Updated dependencies [ad6a006]
- Updated dependencies [9dc254d]
- Updated dependencies [519868d]
  - @mcmec/ui@1.3.0
  - @mcmec/supabase@1.1.0
  - @mcmec/lib@0.6.2

## 0.5.4

### Patch Changes

- Updated dependencies [1bc6947]
  - @mcmec/ui@1.2.1

## 0.5.3

### Patch Changes

- 456bdae: Turned public notice card into a preview card with callbacks to navigate to notice page and share URL.
  Added a new route in public to display a notice.
  Modified design of notice route in notice manager.
- Updated dependencies [456bdae]
  - @mcmec/ui@1.2.0

## 0.5.2

### Patch Changes

- Updated dependencies [d00a319]
- Updated dependencies [fb040ad]
  - @mcmec/ui@1.1.0
  - @mcmec/lib@0.6.1
  - @mcmec/supabase@1.0.2

## 0.5.1

### Patch Changes

- 3f9666d: Created date functions and refactored all date displays in apps to properly render.
- 895f42b: Fixed dashboard incorrectly showing pending notices (set to publish on a future date).
- a142c42: Public notices tables now default to sorting by notice date descending.
- Updated dependencies [3f9666d]
  - @mcmec/lib@0.6.0
  - @mcmec/ui@1.0.1
  - @mcmec/supabase@1.0.1
