---
"@mcmec/sync": patch
"@mcmec/lib": minor
"@mcmec/ui": minor
---

The `website-management` app is retired now that Website Management lives in central at `/website-management` (#250). The shared code only it used goes with it.

`@mcmec/sync` drops `collections/notices` and the `./collections/*` export. Nothing else imported them.

`@mcmec/lib` drops `CENTRAL_URL`, `CENTRAL_FORGOT_PASSWORD_URL`, `getCentralLoginUrl` and `isCentralPath`. Every App's `href` is now a path in central, so nothing links to central from another origin.

`@mcmec/ui`: `AppSwitcher` requires its `LinkComponent`, and every entry is a router link. The fallback that resolved a path against central's origin is gone, along with the plain anchor for an App on another origin. Only the retired apps used either.
