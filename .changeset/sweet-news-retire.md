---
"@mcmec/supabase": minor
"@mcmec/lib": minor
"public": minor
"@mcmec/ui": minor
"notices": patch
---

🌐 Public Application (apps/public)
New Features & Pages
Service Request Forms: Added dedicated forms and submission logic for Adult Mosquito, Mosquitofish, and Water Management requests.
Contact Experience: * Launched a new "Contact Us" page with full form handling.
Added a "Request Success" confirmation page.
Updated the navigation bar with clear links to the new service and contact sections.
Meetings & Notices: Added a new Meetings route and updated navigation links for easier access to public notice archives.
Bot Protection: Integrated Cloudflare Turnstile and "honeypot" fields across all public forms to prevent spam submissions.

Enhancements & UI
Visual Polish: Improved the styling of GlassCard and GlassButton components for better responsiveness and visual hierarchy.
Form Logic: * Enhanced zip code handling with automatic city display.
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

🛠 Shared Packages (packages/*)
UI Components (packages/ui)
New Components: Added CheckboxField, CheckboxInput, TextAreaField, and TextAreaInput.
Refinements: * Improved PhoneInput by removing unnecessary country code logic for a cleaner interface.
Updated FieldLegend and FieldError components for more consistent typography and error visibility.
The SubmitFormButton now intelligently disables itself based on the form's validation state.

Database & Backend (packages/supabase & supabase/)
Schema Updates: Implemented new tables and schemas for adult_mosquito_complaints, water_management_requests, mosquitofish_requests, and zip_codes.
Security: * Updated Row Level Security (RLS) policies to require specific public permissions for form insertions.
Cleaned up unused database fields (e.g., location_of_concern) to streamline the data model.
Validation: Centralized validation logic for emails and phone numbers to ensure data consistency across the stack.

Utilities (packages/lib)
Added standard error messages for invalid phone numbers and updated validation schemas to include phone-specific logic.
