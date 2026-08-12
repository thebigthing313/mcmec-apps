/**
 * Shared brand images, served by the `api` service (see `apps/api/src/assets.ts`).
 *
 * The origin is hardcoded to production on purpose. These bytes are identical in every
 * environment, so pointing staging and local dev at the same host gives one shared browser
 * cache and adds no build-time variable that a service could be provisioned without. `public`
 * could not read such a variable anyway — its API origin is deliberately server-side only.
 *
 * Filenames are unversioned and served `immutable`, so a changed image needs a NEW filename
 * here and in `apps/api/assets/`. Overwriting one in place leaves it cached for a year.
 */
const ASSETS_BASE = "https://api.middlesexmosquito.org/assets";

export const notFoundImage = `${ASSETS_BASE}/404-not-found.png`;
export const building = `${ASSETS_BASE}/building.webp`;
export const countyLogo = `${ASSETS_BASE}/county-logo.png`;
export const favicon = `${ASSETS_BASE}/favicon.ico`;
export const heroMobile = `${ASSETS_BASE}/hero-mobile.avif`;
export const hero = `${ASSETS_BASE}/hero.avif`;
export const logo = `${ASSETS_BASE}/logo.png`;
export const logo192 = `${ASSETS_BASE}/logo192.png`;
export const logo512 = `${ASSETS_BASE}/logo512.png`;
