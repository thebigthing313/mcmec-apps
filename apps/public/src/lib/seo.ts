/**
 * The canonical origin: every URL the site declares about itself — `rel="canonical"`, `og:url`,
 * the JSON-LD `url`, the `Sitemap:` line of robots.txt — is built from this. It is `www` because
 * `www` is the host Railway serves; the bare apex is a registrar forward that only redirects `/`.
 * `public/sitemap.xml` is static and names the same host, so change the two together.
 */
export const SITE_URL = "https://www.middlesexmosquito.org";

export const seo = ({
	title,
	description,
	keywords,
	image,
	url,
	type = "website",
}: {
	title: string;
	description?: string;
	image?: string;
	keywords?: string;
	url?: string;
	type?: string;
}) => {
	const tags = [
		{ title },
		{ content: description, name: "description" },
		{ content: keywords, name: "keywords" },
		{ content: type, name: "og:type" },
		{ content: title, name: "og:title" },
		{ content: description, name: "og:description" },
		...(url ? [{ content: `${SITE_URL}${url}`, name: "og:url" }] : []),
		...(image
			? [
					{ content: image, name: "og:image" },
					{ content: "summary_large_image", name: "twitter:card" },
					{ content: title, name: "twitter:title" },
					{ content: description, name: "twitter:description" },
					{ content: image, name: "twitter:image" },
				]
			: []),
	];

	return tags;
};

export const canonical = (path: string) => ({
	href: `${SITE_URL}${path}`,
	rel: "canonical",
});
