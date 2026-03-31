# @mcmec/supabase-tanstack-db-integration

## 0.2.1

### Patch Changes

- 5c3f9fd: Add service requests and contact submissions management to the notices app

  - Add on-demand collections for adult mosquito complaints, mosquitofish requests, water management requests, and contact form submissions
  - Add full CRUD routes for all 3 service request types and contact submissions with detail, edit, and create pages
  - Restyle dashboard with stat cards, pending requests, open submissions, recent notices, and meetings
  - Add mutation error toasts via TanStack DB isPersisted — only shown when server rejects and optimistic state rolls back
  - Fix useNotices join duplication bug causing cartesian products with employee left join
  - Fix on-demand collection queryKey prefix validation warnings
  - Replace table cell links with clickable rows using navigate

## 0.2.0

### Minor Changes

- 9e06271: Add supabase-tanstack-db-integration package. Bridges TanStack DB with Supabase for reactive collections with optimistic mutations.
