---
"notices": minor
"public": minor
"@mcmec/supabase": minor
---

Add documents system, archive search, and retention warning for LFN 2026-01 compliance

- Add document_types and documents tables with RLS policies and admin CRUD in the notices app
- Add Document Categories management page mirroring the existing notice categories pattern
- Add public /transparency page displaying published documents grouped by type and fiscal year
- Add text search filter to the notice archive feed (NoticeFeed component)
- Add inline retention warning when archiving notices posted less than 7 days ago
