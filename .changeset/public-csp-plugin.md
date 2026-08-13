---
"public": minor
---

Serve the Content-Security-Policy from Nitro instead of `vercel.json`, and let the webfont through

`apps/public/vercel.json` was the only place the CSP was configured, and Railway does not read
that file — the header would have vanished the moment production moved off Vercel. It now comes
from `server/plugins/csp.ts`, set on Nitro's `response` hook so it covers SSR pages, static
assets and error responses alike.

The policy also gained `fonts.googleapis.com` in `style-src` and `fonts.gstatic.com` in
`font-src`. `@mcmec/ui`'s `globals.css` opens with an `@import` of Roboto that survives into the
built stylesheet, and the old policy allowed neither origin — so the font has been blocked in
production and the site has been rendering in the fallback stack (#99). Applied to both copies
of the policy, so it takes effect on whichever host serves production first.

The `vercel.json` long-cache rule was deliberately not carried over: Nitro already sends
`public, max-age=31536000, immutable` with an `ETag` on its content-hashed `/assets/` output, and
correctly withholds it from unhashed files copied out of `public/`.
