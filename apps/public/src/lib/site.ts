/**
 * The canonical origin: every URL the site declares about itself — `rel="canonical"`, `og:url`,
 * the JSON-LD `url`, robots.txt's `Sitemap:` line and every `<loc>` in the sitemap — is built
 * from this. It is `www` because `www` is the host Railway serves; the bare apex is a registrar
 * forward that only redirects `/`. `publicSiteUrl` in `@mcmec/lib/constants/apps` is its twin
 * for the staff app's links out to this site — change the production host there too.
 *
 * Kept in a module of its own, with no imports, because the Nitro server imports it too
 * (`server/routes/robots.txt.ts`, `server/routes/sitemap.xml.ts`): anything added here is
 * bundled into the server.
 */
export const SITE_URL = "https://www.middlesexmosquito.org";
