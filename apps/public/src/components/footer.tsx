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
	return (
		<footer className="w-full border-t bg-accent text-accent-foreground/70">
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
							<span className="mt-1 flex items-center justify-center gap-2 sm:justify-start">
								<Phone size={14} /> {phoneNumber}
							</span>
							<span className="flex items-center justify-center gap-2 sm:justify-start">
								<Printer size={14} /> {faxNumber}
							</span>
						</div>
					</div>

					{/* Quick Links */}
					<div className="flex flex-col gap-2">
						<h3 className="font-bold text-sm uppercase tracking-wide">
							Quick Links
						</h3>
						<nav className="flex flex-col gap-1 text-sm">
							<Link className="hover:underline" to="/contact/service-request">
								Request Service
							</Link>
							<Link
								className="hover:underline"
								to="/mosquito-control/spray-schedule"
							>
								Spray Schedule
							</Link>
							<Link
								className="hover:underline"
								to="/mosquito-surveillance/weekly-activity"
							>
								Weekly Mosquito Activity
							</Link>
							<Link className="hover:underline" to="/job-opportunities">
								Job Opportunities
							</Link>
						</nav>
					</div>

					{/* Public Information */}
					<div className="flex flex-col gap-2">
						<h3 className="font-bold text-sm uppercase tracking-wide">
							Public Information
						</h3>
						<nav className="flex flex-col gap-1 text-sm">
							<Link className="hover:underline" to="/notices">
								Legal Notices
							</Link>
							<Link className="hover:underline" to="/notices/meetings">
								Public Meetings
							</Link>
							<Link className="hover:underline" to="/notices/transparency">
								Transparency
							</Link>
							<Link className="hover:underline" to="/notices/archive">
								Archived Notices
							</Link>
						</nav>
					</div>

					{/* Contact */}
					<div className="flex flex-col gap-2">
						<h3 className="font-bold text-sm uppercase tracking-wide">
							Contact Us
						</h3>
						<nav className="flex flex-col gap-1 text-sm">
							<a
								className="hover:underline"
								href="mailto:clerk@middlesexmosquito.org"
							>
								E-mail Us
							</a>
							<Link className="hover:underline" to="/contact/contact-us">
								Contact Form
							</Link>
						</nav>
					</div>
				</div>
			</div>
		</footer>
	);
}
