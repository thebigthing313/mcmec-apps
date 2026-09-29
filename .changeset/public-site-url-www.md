---
"@mcmec/lib": patch
"central": patch
---

Staff links out to the public website now use `www.middlesexmosquito.org` in production (#274). `PUBLIC_SITE_URL` used to build the bare apex, a registrar forward that 404s every path except `/`, so links from a notice or meeting to its public page broke in production. Staging and local links are unchanged. `@mcmec/lib` also exports the pure `publicSiteUrl(hostname)` that `PUBLIC_SITE_URL` is computed from.
