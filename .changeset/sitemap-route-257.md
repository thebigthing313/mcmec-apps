---
"public": patch
---

Serve `/sitemap.xml` from a server route that builds every `<loc>` from `SITE_URL`, instead of a static file that named the host by hand. Outside production it returns 404, so no staging URL is listed.
