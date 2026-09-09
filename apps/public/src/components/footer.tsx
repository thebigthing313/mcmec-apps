import { countyLogo } from "@mcmec/lib/constants/assets";
import { COMPANY_INFO } from "@mcmec/lib/constants/company";
import { Link } from "@tanstack/react-router";
import { parsePhoneNumberWithError } from "libphonenumber-js";
import { Phone, Printer } from "lucide-react";

export function Footer() {
	const phoneNumber = parsePhoneNumberWithError(
		COMPANY_INFO.phone,
	).formatNational();
	const faxNumber = parsePhoneNumberWithError(
		COMPANY_INFO.fax,
	).formatNational();
	/*
	 * No alpha on the foreground. The `/70` that used to be here thinned the foreground to
	 * 2.17:1 on the old Brackish Teal band — the worst measured contrast on the public site, on
	 * the band that carries the office address, phone number and the Transparency link, on every
	 * page. The ground is near-black now and white on it reads 15.85:1, so an alpha would no
	 * longer fail AA outright; it is still not coming back, because the thing it dimmed is the
	 * agency's contact details.
	 *
	 * `--footer` is this band's own token, not `--accent`. Sharing the hover-and-focus pair is
	 * what previously made a footer recolour a change to every dropdown in five frontends.
	 */
	return (
		/*
		 * The ring inverts on this band. `--ring` is a dark green tuned to clear 3:1 against every
		 * *light* ground in the system; on near-black it measures 1.55:1, under what WCAG 1.4.11
		 * asks of a focus indicator — and this band holds the phone link and three navs, so it is
		 * keyboard territory. White on it is 15.85:1. This is The Focus Ring Contrasts Its Ground
		 * Rule, which already inverts the ring on Commission Green for the same reason.
		 */
		<footer className="w-full border-t bg-footer text-footer-foreground [--ring:var(--footer-foreground)]">
			<div className="mx-auto max-w-7xl px-6 py-10 md:px-12">
				{/*
				 * Four tracks at `lg`, with the agency block taking two of them. It needs the width:
				 * the county mark is ~240px at `h-12` (the artwork is 1337x268), and setting it
				 * beside the address in a third-width column would leave the text under 100px and
				 * break every line. Two tracks give the pair ~575px at the container's full measure.
				 *
				 * This also refills the fourth track that removing Public Information emptied, so
				 * the band spans its measure again instead of trailing off into blank ground.
				 */}
				<div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-2 sm:text-left lg:grid-cols-4">
					{/*
					 * Logo beside the address from `lg`, stacked below it. The pair needs about
					 * 440px to sit side by side and the column is ~300px at `sm` — at that width the
					 * row would squash the mark rather than place it. `shrink-0` keeps flex from
					 * taking the difference out of the logo when the address wraps.
					 */}
					<div className="flex flex-col items-center gap-3 sm:items-start lg:col-span-2 lg:flex-row lg:items-start lg:gap-5">
						<a
							className="shrink-0"
							href="https://www.middlesexcountynj.gov/government/departments/department-of-public-safety-and-health/middlesex-county-mosquito-commission"
							rel="noreferrer"
							target="_blank"
						>
							{/*
							 * Flattened to white, not desaturated. The mark is two-tone — green
							 * wordmark, near-black "COUNTY · NJ" and facets — and that near-black is
							 * within a shade of this band's own ground, so on the teal footer it read
							 * fine and here it disappeared. `grayscale` would not have helped: it
							 * drains the green and leaves the dark artwork exactly as dark.
							 * `brightness-0` forces every opaque pixel to black and `invert` lifts
							 * the lot to white, with the PNG's alpha carrying the shape. 15.85:1.
							 */}
							<img
								alt="Middlesex County Logo"
								className="h-12 brightness-0 invert"
								loading="lazy"
								src={countyLogo}
							/>
						</a>
						<div className="flex flex-col items-center text-sm leading-relaxed sm:items-start">
							<span className="font-bold uppercase tracking-wide">
								{COMPANY_INFO.nameLine1}
							</span>
							<span className="font-semibold uppercase tracking-wide">
								{COMPANY_INFO.nameLine2}
							</span>
							<span>{COMPANY_INFO.addressLine1}</span>
							<span>{COMPANY_INFO.addressLine2}</span>
							{/*
							 * A tappable number. This was plain text, so the one fallback channel a
							 * resident has when the site cannot answer their question required
							 * copying digits off a phone screen by hand. The fax stays text — it is
							 * on the record for the people who need it and nothing dials it.
							 */}
							<a
								className="mt-1 flex min-h-6 items-center justify-center gap-2 font-medium underline underline-offset-2 sm:justify-start"
								href={`tel:${COMPANY_INFO.phone}`}
							>
								<Phone aria-hidden="true" size={14} />
								<span className="sr-only">Telephone</span>
								{phoneNumber}
							</a>
							<span className="flex items-center justify-center gap-2 sm:justify-start">
								<Printer aria-hidden="true" size={14} />
								<span className="sr-only">Fax</span>
								{faxNumber}
							</span>
						</div>
					</div>

					{/* Other Links */}
					<div className="flex flex-col gap-2">
						<h3 className="font-bold text-sm uppercase tracking-wide">
							Other Links
						</h3>
						{/*
						 * Labelled. The footer once held three unlabelled `<nav>` elements and a
						 * landmark rotor read "navigation, navigation, navigation"; this is the last
						 * of them, and it keeps its name so the rotor still says which one it is.
						 */}
						<nav
							aria-label="Other links"
							className="flex flex-col gap-1 text-sm"
						>
							<Link
								className="inline-flex min-h-6 items-center justify-center hover:underline sm:justify-start"
								to="/mosquito-surveillance/municipal-packet"
							>
								Municipal Packet
							</Link>
							<Link
								className="inline-flex min-h-6 items-center justify-center hover:underline sm:justify-start"
								to="/job-opportunities"
							>
								Job Opportunities
							</Link>
						</nav>
					</div>

					{/*
					 * The heading is the link. This column held a heading over two destinations;
					 * with both gone, a bare "Contact Us" label pointing at nothing would be a dead
					 * column, and a one-item list under a heading of the same name would say it
					 * twice. `<h3>` wrapping an `<a>` keeps the column a heading in the outline
					 * while making the words themselves the target.
					 */}
					<div className="flex flex-col gap-2">
						<h3 className="font-bold text-sm uppercase tracking-wide">
							<Link
								className="inline-flex min-h-6 items-center justify-center hover:underline sm:justify-start"
								to="/contact/contact-us"
							>
								Contact Us
							</Link>
						</h3>
					</div>
				</div>
			</div>
		</footer>
	);
}
