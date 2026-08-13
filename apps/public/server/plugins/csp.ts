import type { NitroAppPlugin, NitroRuntimeHooks } from "nitro/types";

/**
 * The site's Content-Security-Policy.
 *
 * This lived in `apps/public/vercel.json` and moved here because Railway does not read that
 * file — a header configured only there silently disappears the moment the app is served from
 * Railway instead of Vercel. Until the Vercel project is retired, production is still served
 * from there, so the two policies must be changed together; the only permitted difference is
 * `vercel.live` / `*.vercel.com`, which Vercel's preview toolbar needs and Railway has no use
 * for. After the cutover this file is the only copy.
 *
 * Only the CSP moved. `vercel.json` also long-cached the build output, but Nitro already sends
 * `public, max-age=31536000, immutable` with an ETag on the content-hashed files it emits under
 * `/assets/`, and correctly withholds it from the unhashed files copied out of `public/`
 * (`sitemap.xml`, the Search Console verification page). That is stricter than the rule it
 * replaces, which matched on file extension alone and would have frozen an unhashed image for a
 * year if one were ever dropped into `public/`.
 *
 * Third-party origins, and why each is here:
 *
 * - `challenges.cloudflare.com` — Turnstile. Loaded as a script from `__root.tsx`, renders its
 *   widget in an iframe, and calls home to verify, so it needs `script-src`, `frame-src` and
 *   `connect-src`.
 * - `fonts.googleapis.com` / `fonts.gstatic.com` — Roboto, pulled in by an `@import` at the top
 *   of `@mcmec/ui`'s `globals.css`. The stylesheet fetch is governed by `style-src`, the font
 *   files it then references by `font-src`. **Neither was allowed before**, so the webfont has
 *   been blocked in production and the site has been rendering in the fallback stack — the
 *   console error in issue #99 is this policy rejecting its own stylesheet. Self-hosting the
 *   font would remove both origins and the extra round trip; until then they have to be here.
 * - `api.middlesexmosquito.org` — the shared brand images, which `api` serves at `/assets/*`.
 *
 * Dropped in the move: `vercel.live` and `*.vercel.com`, which existed only for Vercel's
 * preview toolbar.
 *
 * `'unsafe-inline'` in `script-src` covers the SSR hydration payload TanStack Start inlines into
 * the document; in `style-src`, the inline styles Radix writes for positioned popovers. Removing
 * either needs a per-request nonce threaded through both, which is a change to how the app
 * renders rather than to this header.
 */
const CSP = [
	"default-src 'self'",
	"script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
	"style-src 'self' 'unsafe-inline' data: https://fonts.googleapis.com",
	"font-src 'self' data: https://fonts.gstatic.com",
	"img-src 'self' data: https://api.middlesexmosquito.org",
	"frame-src 'self' https://challenges.cloudflare.com",
	"connect-src 'self' https://challenges.cloudflare.com",
].join("; ");

// Typed off the hook map rather than inline: Nitro bundles `hookable` without its declarations,
// so `hooks.hook()` itself is `any` and an inline callback would be unchecked.
const setCspHeader: NitroRuntimeHooks["response"] = (response) => {
	response.headers.set("Content-Security-Policy", CSP);
};

/**
 * Set from the `response` hook, so it covers everything the server emits — SSR pages, static
 * assets, errors — rather than only the routes that render the shared document head. That is the
 * same reason `robots.ts` uses this hook, and it is what the `source: "/(.*)"` rule in
 * `vercel.json` did.
 */
const csp: NitroAppPlugin = (nitro) => {
	nitro.hooks.hook("response", setCspHeader);
};

export default csp;
