"use client";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@mcmec/ui/components/breadcrumb";
import { Fragment } from "react";

export interface BreadcrumbPart {
	label: string;
	href?: string;
}

interface LayoutBreadcrumbProps {
	items: BreadcrumbPart[];
}

export function LayoutBreadcrumb({ items }: LayoutBreadcrumbProps) {
	if (!items || items.length === 0) {
		return null;
	}

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{items.map((item, index) => {
					const itemKey = item.href || item.label;
					return (
						<Fragment key={itemKey}>
							<BreadcrumbItem>
								{item.href ? (
									<BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
								) : (
									<BreadcrumbPage>{item.label}</BreadcrumbPage>
								)}
							</BreadcrumbItem>
							{index + 1 < items.length ? <BreadcrumbSeparator /> : null}
						</Fragment>
					);
				})}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
