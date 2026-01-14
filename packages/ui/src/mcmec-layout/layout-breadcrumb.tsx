"use client";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@mcmec/ui/components/breadcrumb";
import type { ComponentType, ReactNode } from "react";
import { Fragment } from "react";

export interface BreadcrumbPart {
	label: string;
	href?: string;
}

interface LayoutBreadcrumbProps<
	TLinkProps = { to: string; children: ReactNode },
> {
	items: BreadcrumbPart[];
	LinkComponent?: ComponentType<TLinkProps>;
	getLinkProps?: (href: string) => TLinkProps;
}

export function LayoutBreadcrumb<
	TLinkProps = { to: string; children: ReactNode },
>({
	items,
	LinkComponent,
	getLinkProps = (href) => ({ to: href }) as TLinkProps,
}: LayoutBreadcrumbProps<TLinkProps>) {
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
									LinkComponent ? (
										<BreadcrumbLink asChild>
											<LinkComponent {...getLinkProps(item.href)}>
												{item.label}
											</LinkComponent>
										</BreadcrumbLink>
									) : (
										<BreadcrumbLink href={item.href}>
											{item.label}
										</BreadcrumbLink>
									)
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
