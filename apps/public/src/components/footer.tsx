import { ASSET_URLS } from "@mcmec/lib/constants/assets";
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
		<footer className="w-full border-t bg-background p-4 font-semibold text-primary">
			<div className="flex flex-row items-center justify-start gap-8 px-4">
				<div>
					<img alt="Logo" className="size-24" src={ASSET_URLS.logo512} />
				</div>
				<div className="flex flex-col gap-0 leading-tight">
					<span className="font-extrabold uppercase tracking-wide">
						{COMPANY_INFO.nameLine1}
					</span>
					<span className="font-bold uppercase tracking-wide">
						{COMPANY_INFO.nameLine2}
					</span>
					<span>{COMPANY_INFO.addressLine1}</span>
					<span>{COMPANY_INFO.addressLine2}</span>
					<span className="flex flex-row items-center gap-2">
						<Phone size={18} /> {phoneNumber}
					</span>
					<span className="flex flex-row items-center gap-2">
						<Printer size={18} /> {faxNumber}
					</span>
				</div>
				<div className="flex h-full flex-col gap-0 leading-tight">
					<div className="mb-4 font-bold uppercase tracking-wide">
						Contact Us
					</div>
					<a href="mailto:clerk@middlesexmosquito.org">E-mail Us</a>
					<Link to="/notices">Public Notices</Link>
				</div>
			</div>
		</footer>
	);
}
