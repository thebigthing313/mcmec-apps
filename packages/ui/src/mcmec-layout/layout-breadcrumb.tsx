"use client";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from "@mcmec/ui/components/breadcrumb";

export interface BreadcrumbItem {
	label: string;
	href?: string;
}

interface LayoutBreadcrumbProps {
	items: BreadcrumbItem[];
}

export function LayoutBreadcrumb({ items }: LayoutBreadcrumbProps) {
	if (!items || items.length === 0) {
		return null;
	}

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{items.map((item, index) => (
					<div key={`${item.label}-${index}`} className="flex gap-3 items-center">
						<BreadcrumbItem>
							{item.href ? (
								<BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
							) : (
								<span className="font-normal text-foreground">{item.label}</span>
							)}
						</BreadcrumbItem>
						{index + 1 < items.length ? <BreadcrumbSeparator /> : null}
					</div>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
