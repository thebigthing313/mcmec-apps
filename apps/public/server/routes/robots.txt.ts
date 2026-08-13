import { defineHandler } from "nitro/h3";
import { isProductionSite } from "../environment";

/**
 * The production site's crawl rules. `/contact/request-success` is excluded because it is a
 * post-submission confirmation page with no standalone content — reaching it directly means the
 * visitor arrived from a search result for a page that says a request they never made was
 * received.
 */
const PRODUCTION_ROBOTS = `User-agent: *
Allow: /
Disallow: /contact/request-success

Sitemap: https://middlesexmosquito.org/sitemap.xml
`;

/** Everywhere that is not production: nothing here is meant to be found. */
const NOINDEX_ROBOTS = `User-agent: *
Disallow: /
`;

/**
 * Served from a route rather than `public/robots.txt` so the body can follow the environment at
 * runtime. A file in `public/` is baked into the build and would ship the same crawl rules to
 * staging that it ships to production.
 */
export default defineHandler((event) => {
	event.res.headers.set("Content-Type", "text/plain; charset=utf-8");
	return isProductionSite ? PRODUCTION_ROBOTS : NOINDEX_ROBOTS;
});
