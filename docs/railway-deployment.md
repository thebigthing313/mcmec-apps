# Railway deployment

How the apps run on Railway. The backend (`api`) already deploys this way; the five frontends
are being moved off Vercel to join it.

## Service topology

Six services per environment, in one Railway project (`mcmec`):

| Service | Kind | Serves | Sleeps when idle |
| --- | --- | --- | --- |
| `Postgres` | Docker image | database | no |
| `electric` | Docker image | ElectricSQL sync | no |
| `api` | git → repo | Hono API + shape proxy | no |
| `central`, `admin`, `hr`, `website-management` | git → repo | static SPA (`dist/`) | yes |
| `public` | git → repo | SSR (Nitro) | **no** |

The four staff apps are **Serverless (app sleep)** — they are low-traffic internal tools, and
Railway zeroes idle cost regardless of how many services exist. `public` stays always-on so
search engines never hit a cold boot.

They are four separate services rather than one combined static server so each app deploys
independently: a Railway service is one build producing one container, so bundling them would
mean any change redeploys all of them and one bad build blocks the lot.

"Private" here means auth-gated at the API, **not** network-isolated. The static bundles are
served to the internet; privacy lives in the Better Auth session and permission checks.

## Branch mapping

- **production** environment ← `main`
- **staging** environment ← `develop`

## Per-service configuration

Each app carries its own `apps/<app>/railway.json` with its build command, start command and
watch patterns. The service's **Root Directory stays `/`** (the repo root) so the pnpm
workspace install resolves, and its **config-as-code path** is set to `apps/<app>/railway.json`.

> [!IMPORTANT]
> The repo-root `railway.json` belongs to `api` — its start command is
> `pnpm --filter api db:migrate && pnpm --filter api start`. A service left on the default
> config path while rooted at `/` will read that file and try to boot the API. Always set the
> config path explicitly for the frontend services.

### Static apps

Built with Vite to `dist/`, served by `sirv-cli`:

```
sirv dist --single --etag --host 0.0.0.0
```

- `--single` is the SPA fallback, replacing Vercel's `/(.*) → /index.html` rewrite. Without it
  every deep link (`/employees`, `/notices/:id`) 404s on refresh.
- `--host 0.0.0.0` is **required**. `sirv-cli` defaults `--host` to `localhost`, which in a
  container binds loopback only and makes the service unreachable — Railway returns 502.
- `sirv-cli` reads `PORT` from the environment, which Railway injects.
- `sirv-cli` is a regular `dependency`, not a devDependency: the production install prunes
  devDependencies, so a devDependency would be missing at runtime. (Same reason `tsx` and
  `drizzle-kit` are dependencies of `api`.)

### SSR app (`public`)

Vite builds to `.output/` (Nitro), started with `node .output/server/index.mjs`, which honours
`PORT`. Its runtime dependencies are real `dependencies`, so they survive the prod install.

## Builder and Node version

**Every service builds with Railpack, and takes its Node version from `.nvmrc`.** There is no
`NIXPACKS_NODE_VERSION` variable on any service; if you find one, it is a leftover and does
nothing.

The single builder is not tidiness for its own sake. Nixpacks' pinned nixpkgs offers only
18.20.5 / 20.18.1 / 22.11.0, and the repo's floor is `engines.node >= 22.12` — so under Nixpacks
every available version misses. That matters because **pnpm silently skips optional dependencies
whose `engines` do not match the running Node**: nothing fails at install time, and the missing
package resurfaces much later as a `Cannot find native binding` error that points nowhere near
Node. Nixpacks also **fails open** — `NIXPACKS_NODE_VERSION=23` does not error, it falls back to
`nodejs_18` — so each attempted fix looked like it did nothing. That chain cost several deploys
on `public` (#115).

`api` was the last holdout, kept on Nixpacks with `NIXPACKS_NODE_VERSION=22` (→ 22.11.0) because
it runs `tsx` with no Vite build and had never hit this. It moved to Railpack anyway (#116): a
service running below the floor the repo declares is one dependency away from the same silent
skip, and the diagnosis would look exactly as misleading the second time.

> [!IMPORTANT]
> `api`'s start command is `pnpm --filter api db:migrate && pnpm --filter api start`, so its
> build is in front of the migrations. It fails closed — a broken build leaves the previous
> deployment serving and applies nothing — but land builder changes on staging and watch a
> deploy through before promoting to `main`.

Two guards keep the mismatch from being silent again:

- A root `preinstall` script (`scripts/check-node-version.mjs`) refuses to install on a Node
  below `engines.node`, and refuses if `.nvmrc` itself drops below the floor. It runs before
  `node_modules` exists, so it is Node builtins only.
- CI resolves its Node from `.nvmrc` (`node-version-file`) rather than a loose `22`, so a green
  CI run and a Railway build agree on the version.

## Shared brand images

The nine images every frontend uses — logos, favicon, hero, the 404 illustration — live in
`apps/api/assets/` and are served by the `api` service at `/assets/<filename>`. Apps never
reference them by path; they import the URLs from `@mcmec/lib/constants/assets`.

They previously sat in a public Supabase Storage bucket. `api` inherits that job because it is
the only always-on service present in both environments, and keeping **one** origin is the point:
the six apps share a single copy and a single browser cache entry, and a logo change is one
commit rather than six.

`apps/api/src/assets.ts` reads the directory once at boot into memory (~2 MB) and serves from
there. That is not just a speed trick — a request never carries a caller-supplied path to the
filesystem, so path traversal is unreachable by construction instead of by validation. Responses
carry a content hash as `ETag`, so a client that revalidates anyway gets a 304 rather than 2 MB.

The route sits outside `/api/*` and therefore outside the CORS middleware, deliberately: these
are `<img>` and `<link rel="icon">` loads, which are not CORS-gated and need no origin allowlist.

> [!IMPORTANT]
> `Cache-Control` is `public, max-age=31536000, immutable` — carried over unchanged from the
> Supabase upload. The filenames are **unversioned**, so `immutable` means a browser that has
> `logo512.png` will not ask again for a year. **Changing an image requires a new filename**, in
> `apps/api/assets/` and in `packages/lib/src/constants/assets.ts` together. Overwriting one in
> place looks like it worked — the deploy serves the new bytes, and every returning visitor keeps
> seeing the old one.

`ASSETS_BASE` in `packages/lib/src/constants/assets.ts` is hardcoded to the **production** API
origin, in every environment including local dev. The bytes are identical everywhere, so this
buys one shared cache and adds no build variable a service could be provisioned without. It also
sidesteps a real constraint: `public` could not read such a variable anyway, because its API
origin is deliberately server-side only (`API_URL`, not `VITE_API_URL`). The cost is that staging
loads images from a production host — cosmetic-only if that host is down, and staging is already
non-canonical.

Because of that hardcoding, the staging API's own `/assets/*` is served but never referenced.

`public`'s CSP must therefore allow the API origin in `img-src`. See the caveat under
[Response headers on `public`](#response-headers-on-public).

### Response headers on `public`

The CSP lives in `server/plugins/csp.ts`, set from Nitro's `response` hook so it covers SSR
pages, static assets and errors alike. It was previously configured in
`apps/public/vercel.json`, which **Railway does not read** — a header defined only there
disappears the moment the app is served from Railway.

Both copies exist until the Vercel project is retired, because Vercel still serves production.
Change them together. The one permitted difference is `vercel.live` / `*.vercel.com`, which
Vercel's preview toolbar needs and Railway has no use for.

> [!IMPORTANT]
> The policy must allow `fonts.googleapis.com` in `style-src` and `fonts.gstatic.com` in
> `font-src`. `@mcmec/ui`'s `globals.css` opens with an `@import` of Roboto from Google Fonts,
> and that `@import` survives into the built stylesheet. The original policy allowed neither, so
> the webfont was blocked in production and the site rendered in the fallback stack (#99). A CSP
> rejecting a stylesheet the app itself ships is easy to miss, because nothing fails — the page
> renders, in the wrong font. Self-hosting Roboto would drop both origins and a round trip.

The long-cache rule did **not** move, because Nitro already sends
`public, max-age=31536000, immutable` with an `ETag` on the content-hashed files it emits under
`/assets/`, and withholds it from the unhashed files copied out of `public/` (`sitemap.xml`, the
Search Console verification page). That is stricter than the `vercel.json` rule, which matched on
file extension and would have frozen an unhashed image for a year if one were added to `public/`.

The brand images are unaffected by any of this — their headers come from `api`, which serves them
the same way on either host.

## Search indexing

Exactly one origin belongs in search results: `public` in **production**. Everything else —
the whole staging environment, and the four staff apps in production as well as staging — is
`noindex`.

The stakes are higher than ordinary SEO hygiene. This site is the Commission's official channel
for legal notices under P.L. 2025, c.72, and staging serves the same pages from a database that
gets truncated and reloaded during testing. An indexed staging copy could surface a throwaway
notice as though it were the statutory posting. Staging hosts are ordinary publicly-resolvable
subdomains — they have to be, so the SSO cookie can span them — so nothing about the topology
hides them from a crawler.

### `public`

`server/plugins/robots.ts` sets `X-Robots-Tag: noindex, nofollow` from Nitro's `response` hook,
which covers everything the server emits — SSR pages, static assets, errors — not just routes
that render the shared document head. `server/routes/robots.txt.ts` serves `Disallow: /` in the
same environments. The header is the load-bearing half: `robots.txt` asks crawlers not to
*fetch*, but a URL linked from elsewhere can be indexed without ever being fetched.

`robots.txt` is a route rather than a file in `public/` because a file is baked into the build
and would ship production's crawl rules to staging.

The switch reads `PUBLIC_ENV`, falling back to Railway's injected `RAILWAY_ENVIRONMENT_NAME`, and
asks **"is this production?"** rather than "is this staging?". That direction is deliberate:
asking whether the environment is staging fails open, so a service missing the variable — or an
environment added later under a name nobody thought to check — would be indexed. Asking whether
it is production fails closed, and the worst an unconfigured service can do is decline to be
indexed, which shows up in Search Console instead of silently.

### Staff apps

`central`, `admin`, `hr` and `website-management` carry `<meta name="robots" content="noindex,
nofollow">` in `index.html` and a `public/robots.txt` of `Disallow: /`, in **every** environment
— they have no public audience anywhere. This is not gated on environment, so there is nothing
to configure and nothing to forget.

They get a meta tag rather than a header because `sirv-cli` cannot set response headers. The
coverage is equivalent here: `--single` serves that one document for every path, so every URL a
crawler can reach carries the tag. It would not be equivalent on `public`, which serves PDFs and
XML.

### HTTP Basic auth on staging `public`

**Decided against**, for now. It is the only measure that prevents access rather than requesting
good behaviour, but it would sit in front of every reviewer and every form test, and the major
crawlers honour `X-Robots-Tag`. Nothing links to the staging host, so discovery would have to be
deliberate. If a staging URL ever does appear in search results, Basic auth is the escalation —
add it in `server/plugins/`, gated on the same `PUBLIC_ENV` check.

### Verifying

```bash
curl -sI https://staging.middlesexmosquito.org/ | grep -i x-robots-tag
curl -s  https://staging.middlesexmosquito.org/robots.txt
curl -sI https://middlesexmosquito.org/ | grep -i x-robots-tag   # must print nothing
curl -s  https://middlesexmosquito.org/robots.txt                # must still allow crawling
```

## Environment variables

`VITE_*` variables are **baked in at build time**, not read at runtime. They must be set as
Railway build variables on each frontend service; setting them only at runtime silently ships
a bundle pointing at the wrong API.

| Variable | Services | Notes |
| --- | --- | --- |
| `VITE_API_URL` | central, admin, hr, website-management | API origin, build-time |
| `API_URL` | public | server-side only, never exposed to the browser |
| `VITE_CLOUDFLARE_TURNSTILE_SITEKEY` | public | build-time |
| `PUBLIC_ENV` | public | `production` or `staging`, runtime — see [Search indexing](#search-indexing) |

The `api` service additionally needs every frontend origin in `TRUSTED_ORIGINS`, or the
browser calls fail CORS.

> [!IMPORTANT]
> `TRUSTED_ORIGINS` must contain the origins **as actually configured on the services**, not as
> planned. These are compared as exact strings, so a near miss fails closed and silently: the
> app loads, then every API call is blocked by CORS. Read the real hostnames back from Railway
> (`RAILWAY_PUBLIC_DOMAIN`, or the service's custom domains) rather than trusting a doc. This
> already bit once — `website-management` was provisioned as
> `website-management-staging.…` while the origin list carried `website-staging.…`.

## Domains and the session cookie

Cross-app SSO is a single Better Auth cookie shared across subdomains, so **the apps must sit
under a shared parent domain**. Railway's generated `*.up.railway.app` hosts cannot do this —
they are distinct sites under the public suffix list, so no cookie can span them, and each app
would need its own login.

| Service | production host | staging host |
| --- | --- | --- |
| `central` | `central.middlesexmosquito.org` | `central-staging.middlesexmosquito.org` |
| `admin` | `admin.middlesexmosquito.org` | `admin-staging.middlesexmosquito.org` |
| `hr` | `hr.middlesexmosquito.org` | `hr-staging.middlesexmosquito.org` |
| `website-management` | `website.middlesexmosquito.org` | `website-management-staging.middlesexmosquito.org` |
| `api` | `api.middlesexmosquito.org` | `api-staging.middlesexmosquito.org` |
| `public` | `middlesexmosquito.org` (apex) | `staging.middlesexmosquito.org` |

| Environment | `COOKIE_DOMAIN` | `COOKIE_PREFIX` |
| --- | --- | --- |
| production | `.middlesexmosquito.org` | `mcmec` |
| staging | `.middlesexmosquito.org` | `mcmec-staging` |

`public` is the exception to most of this: it is anonymous, and it forwards form submissions
**server-side** rather than calling the API from the browser, so it never makes a cross-origin
request. It does not need to be in `TRUSTED_ORIGINS`, and it does not need the session cookie.
Its host still lives under the same parent for consistency and TLS convenience.

### `www` and the apex

**The apex is canonical. `www` redirects to it.** Every URL the app declares about itself is
built from `SITE_URL` in `apps/public/src/lib/seo.ts`, which is the bare apex — that is what
goes into the `rel="canonical"` link and `og:url` on every page, what `public/sitemap.xml`
lists, and what the `Sitemap:` line of robots.txt points at.

> [!WARNING]
> **Vercel currently redirects the other way**, and the cutover has to flip it. Today
> `https://middlesexmosquito.org/` returns a 307 to `https://www.middlesexmosquito.org/`, while
> the page served at `www` carries `<link rel="canonical" href="https://middlesexmosquito.org/">`.
> Crawlers are being bounced away from the exact URL the page then nominates as canonical, and
> every `<loc>` in the sitemap is a URL that redirects. It resolves today because Google leans on
> the canonical tag, but it is a conflicting signal that costs nothing to remove.

At cutover, add **both** hosts and make `www` the one that redirects:

1. Add `middlesexmosquito.org` to the production `public` service and point the apex DNS record
   at it.
2. Add `www.middlesexmosquito.org` too, and serve a 308 from `www` to the same path on the apex.
   Do this wherever the redirect is cheapest — at the DNS/CDN provider if it offers host
   redirects, otherwise in `apps/public/server/plugins/`, which already exists for the
   `X-Robots-Tag` header and has the request hook to do it.
3. Leave `www` resolving. It has been the served host for years, so it is what external links
   and existing search results point at; dropping it turns those into hard failures instead of
   redirects.

If the decision ever goes the other way and `www` becomes canonical, `SITE_URL` and
`public/sitemap.xml` have to change with it. Do not leave the app declaring one host while the
edge serves another.

`BETTER_AUTH_URL` must match the host actually serving the API. Change it in the same step as
adding the custom domain, never before — pointing it at a domain that does not resolve yet
breaks auth on the host that is currently working.

`COOKIE_PREFIX` is what keeps the two environments apart. Staging hosts are siblings of
production under the same parent, and the cookie is scoped to that parent — so without
distinct prefixes both environments write the same cookie name at the same scope. Signing into
staging would overwrite a production session and vice versa, and each API would receive the
other environment's token and reject it. That surfaces as sporadic unexplained logouts rather
than as an error, which makes it expensive to diagnose.

## Manual steps (dashboard only)

The Railway CLI can create services and set variables, but it **cannot** set the root directory,
the config-as-code path, the deploy branch, or the Serverless toggle — `railway service` only
lists, deletes, links and redeploys. Connecting a service to GitHub additionally requires the
Railway GitHub App, a browser OAuth flow unreachable from the CLI, the MCP server, or a personal
token.

> [!WARNING]
> **Set the config path before, or immediately when, connecting the repo.** Connecting triggers
> a deploy, and a service rooted at `/` with no config path reads the repo-root `railway.json` —
> which belongs to `api` and starts with `pnpm --filter api db:migrate`. A frontend service left
> in that state will run migrations against the environment's database and try to boot a second
> copy of the API.

For each service:

1. Connect the repo `thebigthing313/mcmec-apps`.
2. Root Directory `/`; config-as-code path `apps/<app>/railway.json`.
3. Set the deploy branch: `main` for production, `develop` for staging.
4. Confirm the build variables (the CLI can set these ahead of time). On `public`, that includes
   `PUBLIC_ENV`. Never create `NIXPACKS_NODE_VERSION` — Railpack ignores it and its presence
   invites someone to "fix" a build by changing it.
5. Enable Serverless on the four staff apps; leave `public` always-on.
6. Add the custom domain and the matching DNS CNAME.
7. Add the new origin to the `api` service's `TRUSTED_ORIGINS` (not needed for `public`).
8. Once the API's own domain resolves, update `BETTER_AUTH_URL` to match and redeploy.
