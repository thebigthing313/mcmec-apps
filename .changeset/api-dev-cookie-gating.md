---
"api": patch
---

Env-gate the Better Auth cross-subdomain cookie so local development works. When `COOKIE_DOMAIN` is set (production) the API keeps issuing a `.middlesexmosquito.org` cross-subdomain SSO cookie; when it's unset (local dev) the API now falls back to a host-only `localhost` cookie — every localhost port shares it, giving the same cross-app SSO in dev without a shared parent domain. Production behavior is unchanged. The `dev` script also loads `apps/api/.env` via `tsx --env-file-if-exists`.
