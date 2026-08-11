---
"website-management": major
"@mcmec/lib": patch
---

Rename the `notices` app to `website-management`.

The app long ago outgrew its name — it manages every kind of content published on the public website (notices, meetings, insecticides, spray schedules, documents, service requests, weekly activity), not just notices. The workspace package and directory are now `website-management`, the UI calls it "Website Management", and the dev server moved from port 3002 to 3006 (3002 collides with other local tooling).

The `notices` domain itself is unchanged — the `notices` table, its collections, and the public site's `/notices` routes keep their names.

**Deployment follow-up:** the production subdomain moves `notices.middlesexmosquito.org` → `website.middlesexmosquito.org` (declared in `@mcmec/lib`'s app registry and the API's `TRUSTED_ORIGINS`), and the Vercel project's root directory must be repointed at `apps/website-management`.
