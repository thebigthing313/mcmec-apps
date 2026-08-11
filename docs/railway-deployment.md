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

## Environment variables

`VITE_*` variables are **baked in at build time**, not read at runtime. They must be set as
Railway build variables on each frontend service; setting them only at runtime silently ships
a bundle pointing at the wrong API.

| Variable | Services | Notes |
| --- | --- | --- |
| `VITE_API_URL` | central, admin, hr, website-management | API origin, build-time |
| `API_URL` | public | server-side only, never exposed to the browser |
| `VITE_CLOUDFLARE_TURNSTILE_SITEKEY` | public | build-time |

The `api` service additionally needs every frontend origin in `TRUSTED_ORIGINS`, or the
browser calls fail CORS.

## Domains and the session cookie

Cross-app SSO is a single Better Auth cookie shared across subdomains, so **the apps must sit
under a shared parent domain**. Railway's generated `*.up.railway.app` hosts cannot do this —
they are distinct sites under the public suffix list, so no cookie can span them, and each app
would need its own login.

| Environment | Hosts | `COOKIE_DOMAIN` | `COOKIE_PREFIX` |
| --- | --- | --- | --- |
| production | `central.`, `admin.`, `hr.`, `website.`, `api.` + apex | `.middlesexmosquito.org` | `mcmec` |
| staging | `central-staging.`, `admin-staging.`, `hr-staging.`, `website-staging.`, `api-staging.` | `.middlesexmosquito.org` | `mcmec-staging` |

`COOKIE_PREFIX` is what keeps the two environments apart. Staging hosts are siblings of
production under the same parent, and the cookie is scoped to that parent — so without
distinct prefixes both environments write the same cookie name at the same scope. Signing into
staging would overwrite a production session and vice versa, and each API would receive the
other environment's token and reject it. That surfaces as sporadic unexplained logouts rather
than as an error, which makes it expensive to diagnose.

## Manual steps (dashboard only)

Connecting a service to GitHub requires the Railway GitHub App, which is a browser OAuth flow —
not reachable from the CLI, the MCP server, or a personal token. For each new service:

1. Create the service and connect the repo `thebigthing313/mcmec-apps`.
2. Set the deploy branch: `main` for production, `develop` for staging.
3. Root Directory `/`; config-as-code path `apps/<app>/railway.json`.
4. Add the build variables above.
5. Enable Serverless on the four staff apps; leave `public` always-on.
6. Add the custom domain and the matching DNS CNAME.
7. Add the new origin to the `api` service's `TRUSTED_ORIGINS`.
