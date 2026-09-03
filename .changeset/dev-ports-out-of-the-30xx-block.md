---
"api": patch
"central": patch
"website-management": patch
"hr": patch
"admin": patch
"public": patch
---

Move the local dev upstreams out of the 30xx block

Another project on the development machine maps ElectricSQL to host port 3001 through Docker,
which is `central`'s Vite port. The collision does not announce itself: Docker's relay accepts
the connection, so `strictPort` sees nothing to refuse and Caddy answers `https://localhost:3444`
with a bare `Not found` — an app that looks broken rather than a port that is taken.

The browse ports are unchanged. Each now proxies to the upstream carrying the same last two
digits one hundred above:

| Browse (https) | Upstream (http) | App |
| -------------- | --------------- | --- |
| 3443 | 3543 | api |
| 3444 | 3544 | central |
| 3445 | 3545 | hr |
| 3446 | 3546 | admin |
| 3447 | 3547 | website-management |
| 3448 | 3548 | public |

The rule is *upstream = browse port + 100*, so a URL in the address bar names the port behind it.
`apps/api`'s `PORT` fallback moves off 3000 for the same reason — that is the other project's
server, and an unset `PORT` used to hand it away. Railway sets `PORT` itself, so nothing deployed
changes.

Picking 35xx is the point rather than picking 3544: 3001–3007 sat adjacent to a range that
project was already using, and it expanded. Update local `.env` files by pulling the new
`.env.example` values, and reload Caddy (`caddy reload --address localhost:2020`).
