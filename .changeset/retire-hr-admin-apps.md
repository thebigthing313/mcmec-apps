---
"@mcmec/sync": patch
---

Retire the `hr` and `admin` apps, now that HR and Admin live in central at `/hr` and `/admin` (#248). Their folders, Caddy entries and dev ports (3445/3545, 3446/3546) are gone, and `pnpm stage` now rebuilds api, central, website-management and public.

`@mcmec/sync` drops `collections/hr` and `collections/admin`, which only those two apps imported.
