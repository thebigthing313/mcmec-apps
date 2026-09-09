/**
 * Shared brand images, served by the `api` service (see `apps/api/src/assets.ts`).
 *
 * The origin defaults to production on purpose. These bytes are identical in every
 * environment, so pointing staging and local dev at the same host gives one shared browser
 * cache and needs no variable a service could be provisioned without — left unset, this behaves
 * exactly as the hardcoded production origin it replaced.
 *
 * `VITE_ASSETS_ORIGIN` overrides it, for the one case the default cannot serve: an image added
 * on a branch does not exist on production until that branch reaches `main`, so a new hero or
 * logo 404s in local dev and on staging. Point it at your own api (`https://localhost:3443`,
 * through Caddy) to see the images the branch actually ships.
 *
 * This is a `VITE_` variable — readable in the browser — where `apps/public`’s API origin
 * deliberately is not. The difference is what it names: unauthenticated static images that are
 * already public bytes and are fetched by `<img src>`, so they cannot be anything but
 * browser-visible; not a data-and-session origin kept out of the site’s CSP.
 *
 * Every consumer is a Vite-processed app, so the value is inlined at build time and
 * `apps/public`’s SSR and client renders agree on it.
 *
 * Filenames are unversioned and served `immutable`, so a changed image needs a NEW filename
 * here and in `apps/api/assets/`. Overwriting one in place leaves it cached for a year.
 */
const ASSETS_ORIGIN =
	import.meta.env.VITE_ASSETS_ORIGIN ?? "https://api.middlesexmosquito.org";

const ASSETS_BASE = `${ASSETS_ORIGIN.replace(/\/+$/, "")}/assets`;

export const notFoundImage = `${ASSETS_BASE}/404-not-found.png`;
export const building = `${ASSETS_BASE}/building.webp`;
export const countyLogo = `${ASSETS_BASE}/county-logo.png`;
export const favicon = `${ASSETS_BASE}/favicon.ico`;
export const heroMobile = `${ASSETS_BASE}/hero-mobile.avif`;
export const hero = `${ASSETS_BASE}/hero.avif`;

/**
 * The home page's hero plate, six photographs of the Commission's own work. The masters and
 * the ffmpeg recipe that produced these live in `apps/api/assets/hero/`.
 */
export const heroBuilding = `${ASSETS_BASE}/hero-building.avif`;
export const heroHelicopter = `${ASSETS_BASE}/hero-helicopter.avif`;
export const heroLab = `${ASSETS_BASE}/hero-lab.avif`;
export const heroOutreach = `${ASSETS_BASE}/hero-outreach.avif`;
export const heroTires = `${ASSETS_BASE}/hero-tires.avif`;
export const heroWaterManagement = `${ASSETS_BASE}/hero-water-management.avif`;
export const logo = `${ASSETS_BASE}/logo.png`;
export const logo192 = `${ASSETS_BASE}/logo192.png`;
/*
 * The masthead mark, at the size a masthead actually paints it. `logo512` is 128KB of PNG and
 * the public navbar renders it into a 48px box — 10.67x its rendered size, downloaded on every
 * page of the site. It stays the 512px icon it was named for; this is the one for an <img>.
 */
export const logoMark = `${ASSETS_BASE}/logo-mark-128.png`;
export const logo512 = `${ASSETS_BASE}/logo512.png`;
