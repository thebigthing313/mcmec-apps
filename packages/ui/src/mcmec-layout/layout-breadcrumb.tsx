"use client";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@mcmec/ui/components/breadcrumb";
import { useLayoutContext } from "@mcmec/ui/mcmec-layout/layout-context.js";
import type { ComponentType, ReactNode } from "react";
import { Fragment } from "react";

export interface BreadcrumbPart {
	label: string;
	href?: string;
}

/**
 * `getLinkProps` must produce links that are active only on an exact path match.
 *
 * Routers commonly treat a link as active on a prefix — a TanStack `Link` to `/notices` reports
 * itself active on `/notices/42` — and set `aria-current="page"` from that. In a breadcrumb it
 * puts the attribute on an ancestor as well as on the real page, so a screen reader is told two
 * entries are the current one. The shell cannot suppress it: the router computes the attribute
 * internally and ignores an `aria-current` passed in from outside. So the consumer's
 * `getLinkProps` owns it — with TanStack that is `activeOptions: { exact: true }`.
 */
interface LayoutBreadcrumbProps<
	TLinkProps = { to: string; children: ReactNode },
> {
	items: BreadcrumbPart[];
	LinkComponent?: ComponentType<TLinkProps>;
	getLinkProps?: (href: string) => TLinkProps;
}

/**
 * Trailing slashes are not a different place.
 *
 * A section route matches at `/spray-schedule` and its index at `/spray-schedule/`, so comparing
 * the two raw strings finds no duplicate and the trail renders the section twice. It also put
 * `aria-current="page"` on two elements at once: TanStack's `Link` sets that attribute itself
 * whenever its destination is the current location, so the earlier crumb claimed to be the
 * current page alongside the real one.
 */
function normalizePath(href: string): string {
	return href.length > 1 && href.endsWith("/") ? href.slice(0, -1) : href;
}

export function LayoutBreadcrumb<
	TLinkProps = { to: string; children: ReactNode },
>({
	items,
	LinkComponent,
	getLinkProps = (href) => ({ to: href }) as TLinkProps,
}: LayoutBreadcrumbProps<TLinkProps>) {
	const { currentPath } = useLayoutContext();
	if (!items || items.length === 0) {
		return null;
	}

	/*
	 * Collapse crumbs that land on the same URL.
	 *
	 * A section and its index are two route matches at one pathname, and both declare a crumb, so
	 * the trail read "Insecticides / Insecticides", "Documents / Documents" and — where the index
	 * had been given a different name for the same place — "Notices / Public Notices Index". A
	 * breadcrumb exists to show the path taken through the hierarchy; the same place cannot be two
	 * steps of it. The first wins, because the section route carries the section's name and the
	 * index carries whatever that one screen was called.
	 */
	const trail = items.filter((item, index) => {
		if (!item.href) {
			return true;
		}
		const here = normalizePath(item.href);
		return (
			items.findIndex(
				(other) => other.href && normalizePath(other.href) === here,
			) === index
		);
	});

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{trail.map((item, index) => {
					const itemKey = item.href || item.label;
					/*
					 * The deepest crumb is not automatically the page you are on.
					 *
					 * This rendered the last item as `BreadcrumbPage` unconditionally, which is only
					 * correct when the leaf route declares a crumb. Where it does not — Admin's employee
					 * detail was exactly that — the trail ends at the section, and marking the section
					 * as the current page tells a screen reader the *list* is current and removes the
					 * only link back to it. Comparing against the real path leaves a trail that stops
					 * short fully navigable.
					 */
					const isLast =
						index === trail.length - 1 &&
						(!item.href ||
							normalizePath(item.href) === normalizePath(currentPath));
					return (
						<Fragment key={itemKey}>
							<BreadcrumbItem>
								{/*
								 * The last crumb is where you already are, so it is never a link —
								 * previously it was, because this branched on `href` alone and the
								 * consuming app gives every crumb one. That also meant `BreadcrumbPage`
								 * never rendered, and with it `aria-current="page"`: the trail told a
								 * screen reader nothing about which entry was the current screen.
								 */}
								{isLast || !item.href ? (
									<BreadcrumbPage>{item.label}</BreadcrumbPage>
								) : LinkComponent ? (
									<BreadcrumbLink asChild>
										<LinkComponent {...getLinkProps(item.href)}>
											{item.label}
										</LinkComponent>
									</BreadcrumbLink>
								) : (
									<BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
								)}
							</BreadcrumbItem>
							{isLast ? null : <BreadcrumbSeparator />}
						</Fragment>
					);
				})}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
