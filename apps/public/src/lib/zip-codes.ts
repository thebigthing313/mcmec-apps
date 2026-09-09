/**
 * The serviced-zip lookup behind the address block on the three service request forms.
 *
 * `zip_codes` is not a reference list of every New Jersey postal code — it is the Commission's
 * service area. So the same table answers two questions at once: which row id a request hangs
 * off, and whether we service the address at all. A code that isn't in it isn't a typo to be
 * corrected, it's an address in somebody else's county.
 */

import type { ZipCodesRowType } from "@mcmec/schemas/db/zip-codes";

/** The row for a typed code, or undefined if the Commission doesn't service it. */
export function findServicedZipCode(
	zipCodes: ZipCodesRowType[],
	value: string,
): ZipCodesRowType | undefined {
	const code = value.trim();
	return zipCodes.find((zipCode) => zipCode.code === code);
}

/**
 * Field validator for the zip input.
 *
 * Silent on anything that isn't yet five digits — the form schema owns that message, and
 * saying "we don't service 085" at the third keystroke would be both wrong and rude.
 */
export function servicedZipCodeValidator(zipCodes: ZipCodesRowType[]) {
	return ({ value }: { value: string }) => {
		const code = value.trim();
		if (!/^\d{5}$/.test(code)) {
			return undefined;
		}
		return findServicedZipCode(zipCodes, code)
			? undefined
			: `${code} is outside our service area — the Commission serves Middlesex County, New Jersey only.`;
	};
}
