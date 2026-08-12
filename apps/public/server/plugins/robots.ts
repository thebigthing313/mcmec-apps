import type { NitroAppPlugin, NitroRuntimeHooks } from "nitro/types";
import { isProductionSite } from "../environment";

/**
 * Keeps every non-production deployment of this site out of search results.
 *
 * `X-Robots-Tag` rather than a `<meta name="robots">` tag, for two reasons: it covers responses
 * that have no document head (PDFs, the sitemap, JSON), and it cannot be missed by a route that
 * renders its own document. Setting it from the `response` hook applies it to everything the
 * server emits — SSR pages, static assets, errors — instead of only the routes that remember to.
 *
 * Paired with `server/routes/robots.txt.ts`. That file asks crawlers not to *fetch*; this header
 * is what actually keeps a URL out of the index, since a page linked from elsewhere can be
 * indexed without ever being fetched. The header is the load-bearing half.
 */
// Typed off the hook map rather than inline: Nitro bundles `hookable` without its declarations,
// so `hooks.hook()` itself is `any` and an inline callback would be unchecked.
const setNoindexHeader: NitroRuntimeHooks["response"] = (response) => {
	response.headers.set("X-Robots-Tag", "noindex, nofollow");
};

const robots: NitroAppPlugin = (nitro) => {
	if (isProductionSite) {
		return;
	}

	nitro.hooks.hook("response", setNoindexHeader);
};

export default robots;
