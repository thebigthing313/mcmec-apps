---
"website-management": patch
"public": patch
"central": patch
"admin": patch
"hr": patch
---

Keep every deployment except the production public site out of search results.

`public` sets `X-Robots-Tag: noindex, nofollow` from a Nitro response hook and serves a
`Disallow: /` robots.txt whenever it is not production, so staging cannot be indexed as a
duplicate of the Commission's official channel for legal notices. The switch asks whether the
environment *is* production rather than whether it is staging, so a service missing its
configuration declines to be indexed instead of quietly appearing in search results.

The four staff apps carry a `noindex` meta tag and a `Disallow: /` robots.txt in every
environment — they have no public audience anywhere.
