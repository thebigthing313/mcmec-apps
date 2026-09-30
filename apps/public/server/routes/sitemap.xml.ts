import { defineHandler } from "nitro/h3";
import { SITE_URL } from "../../src/lib/site";
import { isProductionSite } from "../environment";

type ChangeFreq = "daily" | "weekly" | "monthly";

/**
 * The site's static pages. Paths only: each `<loc>` is `SITE_URL` plus the path, so the host is
 * named once, in `site.ts`.
 *
 * Individual Notices and Job Postings are not listed. Listing them needs a data fetch and a
 * decision about which records belong here.
 */
const PAGES: ReadonlyArray<{
	path: string;
	changefreq: ChangeFreq;
	priority: string;
}> = [
	{ path: "/", changefreq: "weekly", priority: "1.0" },
	{ path: "/about/mission-statement", changefreq: "monthly", priority: "0.7" },
	{ path: "/about/leadership", changefreq: "monthly", priority: "0.7" },
	{ path: "/contact/contact-us", changefreq: "monthly", priority: "0.8" },
	{ path: "/contact/service-request", changefreq: "monthly", priority: "0.8" },
	{
		path: "/contact/adult-mosquito-requests",
		changefreq: "monthly",
		priority: "0.7",
	},
	{
		path: "/contact/mosquitofish-requests",
		changefreq: "monthly",
		priority: "0.7",
	},
	{
		path: "/contact/water-management-requests",
		changefreq: "monthly",
		priority: "0.7",
	},
	{
		path: "/mosquito-control/spray-schedule",
		changefreq: "daily",
		priority: "0.9",
	},
	{
		path: "/mosquito-control/spray-notice",
		changefreq: "monthly",
		priority: "0.7",
	},
	{
		path: "/mosquito-control/how-we-control-mosquitoes",
		changefreq: "monthly",
		priority: "0.7",
	},
	{
		path: "/mosquito-control/mosquito-control-products",
		changefreq: "monthly",
		priority: "0.6",
	},
	{
		path: "/mosquito-control/aerial-larviciding-notice",
		changefreq: "monthly",
		priority: "0.6",
	},
	{
		path: "/mosquito-surveillance/weekly-activity",
		changefreq: "weekly",
		priority: "0.8",
	},
	{
		path: "/mosquito-surveillance/mosquito-source-checklist",
		changefreq: "monthly",
		priority: "0.6",
	},
	{
		path: "/mosquito-surveillance/municipal-packet",
		changefreq: "monthly",
		priority: "0.6",
	},
	{ path: "/notices", changefreq: "daily", priority: "0.9" },
	{ path: "/notices/meetings", changefreq: "weekly", priority: "0.8" },
	{ path: "/notices/archive", changefreq: "weekly", priority: "0.5" },
	{ path: "/notices/transparency", changefreq: "monthly", priority: "0.7" },
	{ path: "/job-opportunities", changefreq: "weekly", priority: "0.8" },
];

const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map(
	({ path, changefreq, priority }) => `  <url>
    <loc>${SITE_URL}${path}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
).join("\n")}
</urlset>
`;

/**
 * Served from a route rather than `public/sitemap.xml` for two reasons: the host comes from
 * `SITE_URL` instead of being written out in every `<loc>`, and the response can follow the
 * environment at runtime. Outside production there is no sitemap at all — a 404 — so nothing
 * lists a staging URL, the same rule `robots.txt.ts` applies to crawl rules.
 */
export default defineHandler((event) => {
	if (!isProductionSite) {
		return new Response(null, { status: 404 });
	}

	event.res.headers.set("Content-Type", "application/xml; charset=utf-8");
	return SITEMAP;
});
