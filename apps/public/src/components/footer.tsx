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
	 * No alpha on the foreground. The `/70` that used to be here thinned the old near-white
	 * `--accent-foreground` to 2.17:1 on Brackish Teal — the worst measured contrast on the
	 * public site, on the band that carries the office address, phone number and the
	 * Transparency link, on every page. `--accent-foreground` is Ink now and the band reads
	 * 5.22:1; re-adding an alpha here would drop it to 3.19:1 and fail AA again.
	 */
	return (
		<footer className="w-full border-t bg-accent text-accent-foreground">
			<div className="mx-auto max-w-7xl px-6 py-10 md:px-12">
				<div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-2 sm:text-left lg:grid-cols-4">
					{/* Agency Info */}
					<div className="flex flex-col items-center gap-3 sm:items-start">
						<a
							href="https://www.middlesexcountynj.gov/government/departments/department-of-public-safety-and-health/middlesex-county-mosquito-commission"
							rel="noreferrer"
							target="_blank"
						>
							<img
								alt="Middlesex County Logo"
								className="h-12"
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

					{/* Quick Links */}
					<div className="flex flex-col gap-2">
						<h3 className="font-bold text-sm uppercase tracking-wide">
							Quick Links
						</h3>
						{/*
						 * Labelled, like its two siblings below. The footer held three unlabelled
						 * `<nav>` elements, so a landmark rotor read "navigation, navigation,
						 * navigation" with no way to tell Quick Links from Contact Us.
						 */}
						<nav
							aria-label="Quick links"
							className="flex flex-col gap-1 text-sm"
						>
							<Link
								className="inline-flex min-h-6 items-center justify-center hover:underline sm:justify-start"
								to="/contact/service-request"
							>
								Request Service
							</Link>
							<Link
								className="inline-flex min-h-6 items-center justify-center hover:underline sm:justify-start"
								to="/mosquito-control/spray-schedule"
							>
								Spray Schedule
							</Link>
							<Link
								className="inline-flex min-h-6 items-center justify-center hover:underline sm:justify-start"
								to="/mosquito-surveillance/weekly-activity"
							>
								Weekly Mosquito Activity
							</Link>
							<Link
								className="inline-flex min-h-6 items-center justify-center hover:underline sm:justify-start"
								to="/job-opportunities"
							>
								Job Opportunities
							</Link>
						</nav>
					</div>

					{/* Public Information */}
					<div className="flex flex-col gap-2">
						<h3 className="font-bold text-sm uppercase tracking-wide">
							Public Information
						</h3>
						<nav
							aria-label="Public information"
							className="flex flex-col gap-1 text-sm"
						>
							<Link
								className="inline-flex min-h-6 items-center justify-center hover:underline sm:justify-start"
								to="/notices"
							>
								Legal Notices
							</Link>
							<Link
								className="inline-flex min-h-6 items-center justify-center hover:underline sm:justify-start"
								to="/notices/meetings"
							>
								Public Meetings
							</Link>
							<Link
								className="inline-flex min-h-6 items-center justify-center hover:underline sm:justify-start"
								to="/notices/transparency"
							>
								Transparency
							</Link>
							<Link
								className="inline-flex min-h-6 items-center justify-center hover:underline sm:justify-start"
								to="/notices/archive"
							>
								Archived Notices
							</Link>
						</nav>
					</div>

					{/* Contact */}
					<div className="flex flex-col gap-2">
						<h3 className="font-bold text-sm uppercase tracking-wide">
							Contact Us
						</h3>
						<nav
							aria-label="Contact us"
							className="flex flex-col gap-1 text-sm"
						>
							<a
								className="inline-flex min-h-6 items-center justify-center hover:underline sm:justify-start"
								href="mailto:clerk@middlesexmosquito.org"
							>
								E-mail Us
							</a>
							<Link
								className="inline-flex min-h-6 items-center justify-center hover:underline sm:justify-start"
								to="/contact/contact-us"
							>
								General Inquiries
							</Link>
						</nav>
					</div>
				</div>
			</div>
		</footer>
	);
}
