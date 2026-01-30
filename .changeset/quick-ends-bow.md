---
"notices": minor
"public": minor
"central": patch
"@mcmec/lib": patch
"@mcmec/ui": patch
---

📱 Public App (apps/public)
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
