/**
 * The bypass-blocks link, in one place for every MCMEC frontend.
 *
 * WCAG 2.4.1 is Level A, and without this a keyboard or screen-reader user walks the whole
 * navigation before reaching the page on every single navigation — eleven rail destinations
 * in Website Management, seven nav groups and their popovers on the public site.
 *
 * This lived inline in the staff layout, under a comment asserting that the public site
 * "has had one of these all along". It had not: `apps/public` carried the `#main-content`
 * target and nothing that pointed at it, so the one frontend with a firm WCAG 2.1 AA
 * obligation was the one missing the link. Extracting it is what makes that class of drift
 * impossible — there is now a single implementation to be right or wrong.
 *
 * Hidden until focused, then drawn as a real control rather than a ghost: someone who tabs
 * into it needs to see where the focus went. The destination needs `tabIndex={-1}` for the
 * jump to land, since a container is not focusable on its own.
 *
 * It sits above `z-50` deliberately. Every sticky app header here is `z-50`, and the link is
 * `absolute` at the top of the same document — equal z-index, so paint order falls to DOM
 * order and the header, coming later, covers the link completely. The link still worked:
 * focus reached it and Enter jumped to the target, so nothing was detectably broken except
 * the one thing it exists to do, which is be seen. Keep this above whatever the tallest
 * header is.
 */
export function SkipLink({
	targetId = "main-content",
	children = "Skip to main content",
}: {
	targetId?: string;
	children?: React.ReactNode;
}) {
	return (
		<a
			className="absolute top-0 left-0 z-[60] -translate-y-full rounded-b-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-transform focus:translate-y-0"
			href={`#${targetId}`}
		>
			{children}
		</a>
	);
}
