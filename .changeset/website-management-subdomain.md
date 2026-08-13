---
"@mcmec/lib": patch
---

Point the app-switcher at the host `website-management` is actually served on

`appUrl("website", …)` produced `website.middlesexmosquito.org` in production and
`website-staging.middlesexmosquito.org` on staging. Neither host has ever existed — the service
is provisioned as `website-management` and `website-management-staging` — so the Website
Management entry in every app's switcher was a dead link in both environments.

`appUrl` appends `-staging` to the label outside production, so the label has to be the
production host minus the root domain, and the staging host has to be exactly that label plus
`-staging`. `website-management` satisfies both; `website` satisfied neither.

Also corrects `TRUSTED_ORIGINS` in `apps/api/.env.example`, which carried the same wrong host,
and drops the apex from that list — `public` forwards form submissions server-side and never
calls the API from the browser, so it needs no origin entry.
