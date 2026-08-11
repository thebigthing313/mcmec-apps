---
"api": patch
"central": patch
"admin": patch
"hr": patch
"website-management": patch
"public": patch
---

Make the frontends deployable on Railway.

Vercel supplied two things these apps silently depended on: a static file server with an SPA
rewrite, and a build pipeline that knew which app it was building. A Railway service supplies
neither — it gives you a container and runs your start command. Nothing here could boot.

**Static serving.** The four SPAs gain `sirv-cli` as a runtime dependency and a start script,
`sirv dist --single --etag --host 0.0.0.0`. `--single` restores the SPA fallback, without which
every deep link 404s on refresh. `--host 0.0.0.0` is not optional: `sirv-cli` defaults `--host`
to `localhost`, so the container would bind loopback and Railway would return 502 with the
process apparently healthy. It is a regular dependency rather than a devDependency because the
production install prunes devDependencies.

**`public`'s start script was broken.** It pointed at `dist/server/server.js` via a `pnpx srvx`
invocation, but the build emits `.output/server/index.mjs` and `srvx` was never a dependency.
`pnpm --filter public start` failed on any machine; nothing had run it, so it went unnoticed and
would have failed on the first SSR deploy. It is now `node .output/server/index.mjs`.

**Per-service config.** Each app carries `apps/<app>/railway.json` with its own build command,
start command and watch patterns. This matters because the repo-root `railway.json` belongs to
`api` and starts with `db:migrate` — any service rooted at the repo root without an explicit
config path would read it and try to boot the API.

**Cookie namespacing.** `COOKIE_PREFIX` now namespaces the session cookie. Staging hosts are
siblings of production under the same parent domain, and the SSO cookie is scoped to that
shared parent, so without distinct prefixes both environments write the same cookie name at
the same scope: signing into staging would clobber a production session and vice versa, and
each API would then receive the other environment's token and reject it. Left alone that
presents as sporadic unexplained logouts rather than as an error. Unset falls back to Better
Auth's default, which is correct for local dev.

`docs/railway-deployment.md` records the topology, per-service settings, build-time variable
rules, the domain and cookie table, and the dashboard-only steps.
