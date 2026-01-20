import { ASSET_URLS } from "@mcmec/lib/constants/assets";
import { COMPANY_INFO } from "@mcmec/lib/constants/company";
import { useIsMobile } from "@mcmec/ui/hooks/use-mobile";

export function Header() {
	const isMobile = useIsMobile();

	return (
		<header className="sticky top-0 z-50 flex w-full flex-row items-center justify-between border-b bg-background sm:px-2 lg:px-16">
			{isMobile ? <MobileHeader /> : <WebHeader />}
		</header>
	);
}

function WebHeader() {
	return (
		<>
			{" "}
			<img alt="Logo" className="h-24 w-auto" src={ASSET_URLS.logo512} />
			<h2 className="font-semibold text-3xl uppercase tracking-tighter">
				{COMPANY_INFO.name}
			</h2>
			<img
				alt="Middlesex County Logo"
				className="h-8 w-auto"
				src={ASSET_URLS.countyLogo}
			/>
		</>
	);
}

function MobileHeader() {
	return (
		<>
			<img alt="Logo" className="h-24 w-auto" src={ASSET_URLS.logo512} />
			<img
				alt="Middlesex County Logo"
				className="h-8 w-auto"
				src={ASSET_URLS.countyLogo}
			/>
		</>
	);
}
