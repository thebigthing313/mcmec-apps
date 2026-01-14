import { ASSET_URLS } from "@mcmec/lib/constants/assets";
import { COMPANY_INFO } from "@mcmec/lib/constants/company";
export function Header() {
	return (
		<header className="sticky top-0 z-50 mb-2 flex w-full flex-row items-center gap-2 bg-background backdrop-blur-md">
			<img alt="Logo" className="h-24 w-auto" src={ASSET_URLS.logo512} />
			<div className="w-sm">
				<h1 className="font-bold text-2xl">{COMPANY_INFO.shortName}</h1>
				<h2 className="font-semibold text-xl">{COMPANY_INFO.name}</h2>
			</div>
		</header>
	);
}
