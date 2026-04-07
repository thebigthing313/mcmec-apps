import * as React from "react";
import { cn } from "@mcmec/ui/lib/utils";

interface SectionSidebarLink {
	label: string;
	href: string;
	isActive?: boolean;
}

interface SectionSidebarProps {
	title: string;
	links: SectionSidebarLink[];
	className?: string;
	renderLink?: (
		link: SectionSidebarLink,
		className: string,
	) => React.ReactNode;
}

function SectionSidebar({
	title,
	links,
	className,
	renderLink,
}: SectionSidebarProps) {
	return (
		<aside
			className={cn("hidden shrink-0 md:block md:w-56", className)}
			aria-label={`${title} section navigation`}
		>
			<nav>
				<h2 className="mb-3 border-b border-primary/20 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					{title}
				</h2>
				<ul className="flex flex-col gap-0">
					{links.map((link) => {
						const linkClassName = cn(
							"block whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors",
							link.isActive
								? "border-l-2 border-primary bg-primary/10 font-medium text-primary"
								: "text-muted-foreground hover:bg-muted hover:text-foreground",
						);

						return (
							<li key={link.href}>
								{renderLink ? (
									renderLink(link, linkClassName)
								) : (
									<a href={link.href} className={linkClassName}>
										{link.label}
									</a>
								)}
							</li>
						);
					})}
				</ul>
			</nav>
		</aside>
	);
}

interface SectionLayoutProps {
	sidebar: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}

function SectionLayout({ sidebar, children, className }: SectionLayoutProps) {
	return (
		<div
			className={cn(
				"flex flex-col gap-6 md:flex-row md:gap-10",
				className,
			)}
		>
			{sidebar}
			<div className="min-w-0 flex-1">{children}</div>
		</div>
	);
}

export { SectionSidebar, SectionLayout };
export type { SectionSidebarLink, SectionSidebarProps, SectionLayoutProps };
