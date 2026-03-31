---
"notices": minor
"@mcmec/supabase": minor
"@mcmec/supabase-tanstack-db-integration": patch
---

Add service requests and contact submissions management to the notices app

- Add on-demand collections for adult mosquito complaints, mosquitofish requests, water management requests, and contact form submissions
- Add full CRUD routes for all 3 service request types and contact submissions with detail, edit, and create pages
- Restyle dashboard with stat cards, pending requests, open submissions, recent notices, and meetings
- Add mutation error toasts via TanStack DB isPersisted — only shown when server rejects and optimistic state rolls back
- Fix useNotices join duplication bug causing cartesian products with employee left join
- Fix on-demand collection queryKey prefix validation warnings
- Replace table cell links with clickable rows using navigate
