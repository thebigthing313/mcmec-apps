---
"@mcmec/supabase": minor
"@mcmec/assets": minor
"notices": minor
"public": minor
"@mcmec/ui": patch
---

🌐 Public App (apps/public)
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
