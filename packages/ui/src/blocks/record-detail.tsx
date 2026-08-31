import type { ReactNode } from "react";
import { cn } from "../lib/utils";

/**
 * The one detail page, and the answer to seven of them.
 *
 * `RecordIndex` ended eleven copies of the same table; the screens those tables link *to* were
 * still four different products. A Notice, a Meeting and a Spray Mission put their metadata in
 * `<h4>`s inside a `.prose` article. A Job Posting used a `<dl>` in one card with its content in
 * another. A Public Request used a two-column grid of `<p>`s. A Document had a bare link and no
 * metadata vocabulary at all. Someone who had learned where the date sits on a Notice re-learned
 * it on every other record.
 *
 * Two things it fixes beyond the arrangement:
 *
 * - **The metadata is a `<dl>`, not headings.** `<h4>Type: Legal</h4>` under an `<h1>` skips two
 *   levels and calls a value a section — the outline a screen reader reads out was a list of
 *   sections that contain nothing. A description list is what a label/value pair actually is.
 * - **The toolbar is not a `<nav>`.** Every one of the seven wrapped Back, Edit *and* the
 *   lifecycle buttons in a navigation landmark. Publish and Archive are not navigation, and the
 *   shell's breadcrumb is already the page's wayfinding — DESIGN.md calls it the only wayfinding
 *   above the page title, so a second landmark here competes with it for no gain.
 *
 * The record's own body — rendered rich text, a link out, a details panel — stays with the route
 * as `children`. The arrangement belongs to the system; the domain belongs to the screen.
 */
export interface RecordDetailField {
	label: string;
	/** Rendered as-is. A missing value should read as a word, not an empty cell. */
	value: ReactNode;
}

export function RecordDetail({
	actions,
	backLink,
	badge,
	children,
	className,
	danger,
	fields,
	subtitle,
	title,
}: {
	/** Edit and the lifecycle buttons. Not navigation — see the note above. */
	actions?: ReactNode;
	/** The caller's own typed link back to the register, already wrapped in a Button. */
	backLink: ReactNode;
	/** The record's state, always carrying its word (DESIGN.md's Status Is A Word rule). */
	badge?: ReactNode;
	children?: ReactNode;
	className?: string;
	/**
	 * The record's `DangerZoneCard`, if it has one. A slot rather than a child because delete is
	 * not part of the record — it is what can be done to it, and it belongs outside the article.
	 */
	danger?: ReactNode;
	/** Label/value metadata. Omit for a record that genuinely has none. */
	fields?: RecordDetailField[];
	/** One line under the title — a type, a time range, a person. Never a heading. */
	subtitle?: ReactNode;
	title: string;
}) {
	return (
		<div className={cn("max-w-2xl space-y-6", className)}>
			<div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card p-4">
				{backLink}
				{actions ? (
					<div className="flex flex-wrap items-center gap-2">{actions}</div>
				) : null}
			</div>

			<article className="space-y-4">
				<header className="space-y-1">
					<div className="flex flex-row flex-wrap items-baseline gap-2">
						<h1 className="font-semibold text-foreground text-xl leading-tight">
							{title}
						</h1>
						{badge}
					</div>
					{subtitle ? (
						<p className="text-muted-foreground">{subtitle}</p>
					) : null}
				</header>

				{fields && fields.length > 0 ? (
					// Two columns from `sm` up, one below. The term column is sized to its content
					// rather than to a fraction, so a short label does not strand its value halfway
					// across the page.
					<dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
						{fields.map((field) => (
							<div className="contents" key={field.label}>
								<dt className="text-muted-foreground">{field.label}</dt>
								<dd className="text-foreground">{field.value}</dd>
							</div>
						))}
					</dl>
				) : null}

				{children}
			</article>

			{danger}
		</div>
	);
}
