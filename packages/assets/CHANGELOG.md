# @mcmec/assets

## 1.0.0

### Major Changes

- ad6a006: UI & Design Updates
  New Homepage: Replaced the splash page with a new, modern Hero section.
  Enhanced Navigation: Restructured the navigation bar and updated menu items for better site flow.
  Visual Improvements: Added gradient overlays and scroll indicators to page layouts for a more polished look.
  Refined Footer: Updated the footer design to improve text visibility and overall layout.
  Cleaner Layouts: Streamlined the interface by removing redundant header elements and improving content centering across the app.

  Performance & System
  Cross-Platform Reliability: Updated internal build scripts to ensure consistent performance across different operating systems.
  Asset Management: Improved the way shared assets and dependencies are synced during development and deployment.

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
