# central

## 0.4.4

### Patch Changes

- Updated dependencies [803e1f7]
  - @mcmec/ui@1.5.2

## 0.4.3

### Patch Changes

- Updated dependencies [c45311a]
  - @mcmec/ui@1.5.1
  - @mcmec/supabase@1.7.1

## 0.4.2

### Patch Changes

- Updated dependencies [705816d]
- Updated dependencies [744da27]
- Updated dependencies [74f924d]
- Updated dependencies [d7980a2]
  - @mcmec/ui@1.5.0
  - @mcmec/supabase@1.7.0

## 0.4.1

### Patch Changes

- Updated dependencies [b37462b]
  - @mcmec/supabase@1.6.0
  - @mcmec/lib@0.8.0
  - @mcmec/auth@0.3.1
  - @mcmec/ui@1.4.5

## 0.4.0

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

## 0.3.0

### Minor Changes

- b9b91e2: Centralize login through central app with branded auth layout. PKCE flow with shared cookie domain for production, hash fragment tokens for local dev. Add processAuthRedirect and getCentralLoginUrl helpers.

### Patch Changes

- Updated dependencies [b9b91e2]
- Updated dependencies [1a77b67]
- Updated dependencies [8dc9b46]
- Updated dependencies [5c3f9fd]
  - @mcmec/auth@0.3.0
  - @mcmec/lib@0.7.3
  - @mcmec/supabase@1.4.0
  - @mcmec/ui@1.4.3

## 0.2.1

### Patch Changes

- 95e01c3: Move shared assets to Supabase Storage. Remove packages/assets, sync-assets build step, and shx dependency. Apps now import asset URLs from @mcmec/lib/constants/assets.
- Updated dependencies [187f5d9]
- Updated dependencies [95e01c3]
- Updated dependencies [501ef75]
  - @mcmec/lib@0.7.2
  - @mcmec/supabase@1.3.1
  - @mcmec/ui@1.4.2
  - @mcmec/auth@0.2.1

## 0.2.0

### Minor Changes

- 2cea2d6: Rework auth flow to use email-based invites via Resend SMTP. Replace create-account edge function with invite-employee. Add set-password, forgot-password, and reset-password pages to central. Update both apps to use @mcmec/auth package with typed errors.

### Patch Changes

- dcf90f1: Hotfix for explicit build output directory on Vercel configuration.
- Updated dependencies [a8b88f5]
- Updated dependencies [2affcd1]
- Updated dependencies [184752c]
  - @mcmec/auth@0.2.0
  - @mcmec/lib@0.7.1
  - @mcmec/supabase@1.3.0
  - @mcmec/ui@1.4.1

## 0.1.7

### Patch Changes

- Updated dependencies [43272a7]
  - @mcmec/supabase@1.2.0
  - @mcmec/lib@0.7.0
  - @mcmec/ui@1.4.0

## 0.1.6

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

- Updated dependencies [b5445c3]
- Updated dependencies [43306d2]
  - @mcmec/ui@1.3.1
  - @mcmec/lib@0.6.3
  - @mcmec/supabase@1.1.1

## 0.1.5

### Patch Changes

- Updated dependencies [ad6a006]
- Updated dependencies [9dc254d]
- Updated dependencies [519868d]
  - @mcmec/ui@1.3.0
  - @mcmec/supabase@1.1.0
  - @mcmec/lib@0.6.2

## 0.1.4

### Patch Changes

- 2cb183e: Fixed scrollbar not resetting to top of content div when navigating.
- Updated dependencies [1bc6947]
  - @mcmec/ui@1.2.1

## 0.1.3

### Patch Changes

- Updated dependencies [456bdae]
  - @mcmec/ui@1.2.0

## 0.1.2

### Patch Changes

- Updated dependencies [d00a319]
- Updated dependencies [fb040ad]
  - @mcmec/ui@1.1.0
  - @mcmec/lib@0.6.1
  - @mcmec/supabase@1.0.2

## 0.1.1

### Patch Changes

- Updated dependencies [3f9666d]
  - @mcmec/lib@0.6.0
  - @mcmec/ui@1.0.1
  - @mcmec/supabase@1.0.1
