import type * as React from "react";

/**
 * The heading every staff screen opens with.
 *
 * Before this existed, fourteen screens invented their own: `font-bold text-3xl`,
 * `font-bold text-2xl`, `font-semibold text-2xl`, and — on the notices list — no heading element
 * at all, so the page began with a button. DESIGN.md names one Headline role for a staff page
 * title, and none of the three matched it.
 *
 * `description` and `actions` are here because the screens that drifted all had them: a muted
 * sentence under the title, a primary button opposite it. Leaving those to each screen is what
 * produced three different header layouts in the first place, so the block owns the arrangement
 * and the screen owns only the content.
 *
 * This is a weaker guarantee than the branded `AccessibleApps` type, which makes its mistake
 * uncompilable — a screen can still forget to render this. The alternative was for the shell to
 * derive the title from the last breadcrumb, which cannot be forgotten but also cannot carry a
 * description or an action button, and would reflow every screen that has one.
 */
export function PageHeader({
	actions,
	description,
	title,
}: {
	/** Trailing controls — typically the screen's one primary action. */
	actions?: React.ReactNode;
	/** One muted sentence saying what the screen is for. Omit rather than padding it out. */
	description?: React.ReactNode;
	title: string;
}) {
	return (
		<div className="mb-6 flex items-start justify-between gap-4">
			<div className="min-w-0">
				{/*
				 * Headline, per DESIGN.md: 600 at 1.25rem. Deliberately not larger — a staff screen
				 * is read by someone who navigated here on purpose and already knows where they are
				 * from the rail and the breadcrumb. The title confirms; it does not announce.
				 */}
				<h1 className="font-semibold text-foreground text-xl leading-tight">
					{title}
				</h1>
				{description ? (
					<p className="mt-1 text-muted-foreground text-sm leading-relaxed">
						{description}
					</p>
				) : null}
			</div>
			{actions ? (
				<div className="flex shrink-0 items-center gap-2">{actions}</div>
			) : null}
		</div>
	);
}
