---
"@mcmec/lib": patch
---

Make the app switcher environment-aware. It decided production by testing whether the hostname
merely _contained_ `middlesexmosquito.org`, which is true on the staging siblings too — so every
switcher link on `*-staging.middlesexmosquito.org` pointed at production, silently walking a
staging session into live data. The environment is now derived from the subdomain label left of
the root domain, so staging links to staging and production to production with no per-service
configuration to forget.

Local dev links now use the Caddy https ports (3444–3447) instead of the raw Vite upstreams. An
`http://` page calling the `https://` API is cross-site under schemeful same-site, so the session
cookie was withheld and switching apps in dev bounced straight to `/login`.
