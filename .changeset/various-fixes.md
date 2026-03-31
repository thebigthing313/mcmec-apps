---
"central": minor
"admin": minor
"hr": minor
"notices": minor
"public": minor
"@mcmec/supabase": minor
"@mcmec/ui": patch
---

Fix auth loop in admin/HR apps, improve public nav bar, and resolve various issues.

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
