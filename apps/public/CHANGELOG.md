# public

## 1.5.0

### Minor Changes

- 705816d: Refresh public website design: add Roboto font, refine color palette and shadows, reduce desktop typography scale, add section sidebar navigation, restructure home page with action cards, expand footer with site-wide links, and improve mobile navigation.
- aea9286: Improve SEO for the public website: add per-page meta tags, canonical URLs, robots.txt, sitemap.xml, structured data (JSON-LD), custom 404 page, lazy loading, and cache headers
- 74f924d: Add mosquito spray schedule feature with admin CRUD in notices app, public display with filters at /spray-schedule, new TimeField and MultiComboboxField UI components, and dashboard integration.
- abc06a4: Restructure public website navigation: add Mosquito Control, Mosquito Surveillance, and Job Opportunities sections; move existing pages to new URL paths with 301 redirects from old URLs; add stub pages for spray notice, aerial larviciding, weekly activity, source checklist, and municipal packet.
- d7980a2: Add weekly mosquito activity feature with CSV upload in notices app and recharts-powered visualization on the public site at /mosquito-surveillance/weekly-activity.

### Patch Changes

- 744da27: Add content to under-construction public pages: spray notice, aerial larviciding notice, mosquito source checklist, and municipal packet. Fix CSS @import ordering in globals.css.
- Updated dependencies [705816d]
- Updated dependencies [744da27]
- Updated dependencies [74f924d]
- Updated dependencies [d7980a2]
  - @mcmec/ui@1.5.0
  - @mcmec/supabase@1.7.0

## 1.4.0

### Minor Changes

- b37462b: Add job postings feature with HR management CRUD and public careers pages

### Patch Changes

- Updated dependencies [b37462b]
  - @mcmec/supabase@1.6.0
  - @mcmec/lib@0.8.0
  - @mcmec/ui@1.4.5

## 1.3.1

### Patch Changes

- Fix hero image using relative path instead of Supabase Storage URL

## 1.3.0

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

## 1.2.0

### Minor Changes

- 1a77b67: Add documents system, archive search, and retention warning for LFN 2026-01 compliance

  - Add document_types and documents tables with RLS policies and admin CRUD in the notices app
  - Add Document Categories management page mirroring the existing notice categories pattern
  - Add public /transparency page displaying published documents grouped by type and fiscal year
  - Add text search filter to the notice archive feed (NoticeFeed component)
  - Add inline retention warning when archiving notices posted less than 7 days ago

### Patch Changes

- Updated dependencies [b9b91e2]
- Updated dependencies [1a77b67]
- Updated dependencies [8dc9b46]
- Updated dependencies [5c3f9fd]
  - @mcmec/lib@0.7.3
  - @mcmec/supabase@1.4.0
  - @mcmec/ui@1.4.3

## 1.1.2

### Patch Changes

- 95e01c3: Move shared assets to Supabase Storage. Remove packages/assets, sync-assets build step, and shx dependency. Apps now import asset URLs from @mcmec/lib/constants/assets.
- Updated dependencies [187f5d9]
- Updated dependencies [95e01c3]
- Updated dependencies [501ef75]
  - @mcmec/lib@0.7.2
  - @mcmec/supabase@1.3.1
  - @mcmec/ui@1.4.2

## 1.1.1

### Patch Changes

- 062f055: Turnstile hotfix.
- 5fbfb4f: Hotfix for broken link on home page to public meetings page.
- Updated dependencies [a8b88f5]
- Updated dependencies [2affcd1]
- Updated dependencies [184752c]
  - @mcmec/lib@0.7.1
  - @mcmec/supabase@1.3.0
  - @mcmec/ui@1.4.1

## 1.1.0

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
  - @mcmec/supabase@1.2.0
  - @mcmec/lib@0.7.0
  - @mcmec/ui@1.4.0

## 1.0.0

### Major Changes

- 5c472da: Migrated public website to Tanstack Start framework.

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

## 0.9.0

### Minor Changes

- ad6a006: UI & Design Updates
  New Homepage: Replaced the splash page with a new, modern Hero section.
  Enhanced Navigation: Restructured the navigation bar and updated menu items for better site flow.
  Visual Improvements: Added gradient overlays and scroll indicators to page layouts for a more polished look.
  Refined Footer: Updated the footer design to improve text visibility and overall layout.
  Cleaner Layouts: Streamlined the interface by removing redundant header elements and improving content centering across the app.

  Performance & System
  Cross-Platform Reliability: Updated internal build scripts to ensure consistent performance across different operating systems.
  Asset Management: Improved the way shared assets and dependencies are synced during development and deployment.

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
  - @mcmec/assets@1.0.0
  - @mcmec/ui@1.3.0
  - @mcmec/supabase@1.1.0
  - @mcmec/lib@0.6.2

## 0.8.0

### Minor Changes

- 1bc6947: Added archived notices feature. Notice feed now has pagination and filtering components.

### Patch Changes

- 2cb183e: Fixed scrollbar not resetting to top of content div when navigating.
- Updated dependencies [1bc6947]
  - @mcmec/ui@1.2.1

## 0.7.0

### Minor Changes

- 456bdae: Turned public notice card into a preview card with callbacks to navigate to notice page and share URL.
  Added a new route in public to display a notice.
  Modified design of notice route in notice manager.

### Patch Changes

- c6cc549: Fixed minor styling issues.
- Updated dependencies [456bdae]
  - @mcmec/ui@1.2.0

## 0.6.0

### Minor Changes

- d00a319: Applied Middlesex County styling guidelines and web/mobile layouts for the public website.
- fb040ad: Created footer for public website.

### Patch Changes

- Updated dependencies [d00a319]
- Updated dependencies [fb040ad]
  - @mcmec/ui@1.1.0
  - @mcmec/lib@0.6.1
  - @mcmec/supabase@1.0.2

## 0.5.1

### Patch Changes

- Updated dependencies [3f9666d]
  - @mcmec/lib@0.6.0
  - @mcmec/ui@1.0.1
  - @mcmec/supabase@1.0.1
