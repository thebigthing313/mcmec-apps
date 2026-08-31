/*
 * THESIS: The staff front door is the title page of the register, not a card floated on a
 * gradient. It refuses the split-screen photo login every admin product ships.
 * OWN-WORLD: Hue-150 paper, one hairline in Rule, Roboto only. Type breaks *across* the top and
 * bottom rules — a masthead, not a header. Commission Green appears once, on the action.
 * STORY: A long-tenured employee recognises the Commission's own stationery, signs in, and never
 * thinks about the screen again.
 * FIRST VIEWPORT: A hairline frame inset from every viewport edge. The Commission's name sits on
 * the top rule at the left, the destination application at the right; the office address and
 * Established 1914 sit on the bottom rule the same way. Inside, empty paper, then one left-aligned
 * column: heading, a ruled field block, and the green action bottom-left of it.
 * FORM: The Colophon — candidate 6 of 7, dealt by seed 078f01ed (surface / operate), code-led.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the
 * verdict, DESIGN.md, and every shipping raster carrying its provenance.
 */

import type { AppName } from "@mcmec/lib/constants/apps";
import { building } from "@mcmec/lib/constants/assets";
import { COMPANY_INFO } from "@mcmec/lib/constants/company";
import { cn } from "../lib/utils";

/**
 * A label sitting *on* a rule rather than above it.
 *
 * The rule is drawn as flex children instead of a border so the type can interrupt it: a short
 * stub turns the corner, the label breaks the line, and the remainder runs to the far edge. A
 * `<legend>`-style background knockout was the alternative and is worse here — it depends on the
 * label's ground matching the page's exactly, which stops being true the moment anything sits
 * behind the frame.
 */
function MastheadRule({
	start,
	end,
	delay,
}: {
	start: React.ReactNode;
	end: React.ReactNode;
	delay: string;
}) {
	return (
		<div className="flex shrink-0 items-center gap-3 sm:gap-4">
			{/* All three spans draw, so the rule arrives as one line rather than as a middle
			    section growing between two stubs that were already there. The stubs carried
			    `origin-*` and no animation, which is the shape of an intention half-applied. */}
			<span
				aria-hidden
				className="h-px w-4 origin-left animate-rule-x bg-border sm:w-8"
				style={{ animationDelay: delay }}
			/>
			{start}
			<span
				aria-hidden
				className="h-px flex-1 origin-left animate-rule-x bg-border"
				style={{ animationDelay: delay }}
			/>
			{end}
			<span
				aria-hidden
				className="h-px w-4 origin-right animate-rule-x bg-border sm:w-8"
				style={{ animationDelay: delay }}
			/>
		</div>
	);
}

/**
 * Structural caps, in the sense DESIGN.md's Uppercase Is Structural Rule means: these mark the
 * edge between the page and everything outside it, and nobody reads them for content. They are
 * set below the size of the material they enclose, like the rail's group labels.
 */
function Masthead({ children }: { children: React.ReactNode }) {
	return (
		<span className="whitespace-nowrap font-bold text-muted-foreground text-xs uppercase leading-none tracking-[0.16em]">
			{children}
		</span>
	);
}

/**
 * The frontispiece: the Commission's building as a plate at the head of the page.
 *
 * A photograph on a title page is a plate — tipped in above the text block, bordered, captioned
 * by the page around it. It is not a backdrop. That distinction is the whole reason this can
 * exist here at all: the arrangement DESIGN.md rejects by name is the marketing split-screen,
 * a photo owning half the viewport behind a green scrim with the form floating on top of it.
 * Nothing is laid over this image, it carries no gradient, and it never competes with the form
 * for the same pixels — it sits above the heading at the register's own width and stops.
 *
 * It also earns its place structurally. The frame's interior was mostly empty at desktop, with
 * the whole text block floating in the vertical middle of an 800px void; the plate is what that
 * space was missing. Square corners and a 1px border in Rule, because it is set into the same
 * frame as everything else and the system is flat.
 *
 * The crop is chosen, not defaulted. `building.webp` is 1296x968: sky down to roughly a quarter,
 * the building and the Commission's own signboard through the middle, and a bottom third of dull
 * winter lawn. Run full-width across this register it becomes a 6:1 slit, and `object-center`
 * then lands it precisely on the ramp railing and the grass with the roofline cut off above —
 * a photograph of nothing, which is how a real building ends up looking like stock texture. So
 * the plate is capped to hold a roughly 5:2 figure rather than a band, and the focal point is
 * lifted to 45% to keep the roofline and drop the lawn.
 *
 * That cap is `max-w-2xl`, the action row's measure, so the page terminates on two registers —
 * the 28rem entry column and this 42rem one — inside full-width rules, rather than on three
 * ragged edges at whatever width each element happened to want.
 *
 * Height also yields to the viewport. `max-h-[30vh]` shrinks the plate on a short screen instead
 * of pushing the button below the fold, and below 600px tall — a landscape phone, or a desktop at
 * 200% zoom — it goes entirely: there is room for the form or the picture, and the form is why
 * anyone is here.
 */
function Frontispiece() {
	return (
		<figure className="mb-9 max-w-2xl [@media(max-height:1000px)]:mb-4 [@media(max-height:600px)]:hidden">
			<img
				alt="The Commission's offices in Edison, New Jersey"
				className="h-40 max-h-[30vh] w-full border border-border object-cover object-[center_45%] sm:h-52 lg:h-64"
				decoding="async"
				src={building}
			/>
		</figure>
	);
}

interface AuthShellProps {
	/**
	 * Which application this door opens. It rides the top rule opposite the Commission's name
	 * rather than heading the page: one SSO cookie spans all four applications, so the app is
	 * where you are, not what you are doing.
	 */
	destination: AppName;
	children: React.ReactNode;
}

export function AuthShell({ destination, children }: AuthShellProps) {
	return (
		<main className="relative min-h-svh bg-background text-foreground">
			<div className="absolute inset-3 flex flex-col sm:inset-6 md:inset-10">
				<MastheadRule
					delay="0ms"
					end={<Masthead>{destination}</Masthead>}
					start={
						<>
							{/* The full name is the masthead; below `sm` it would wrap the rule off-screen. */}
							<Masthead>
								<span className="hidden sm:inline">{COMPANY_INFO.name}</span>
								<span className="sm:hidden">{COMPANY_INFO.shortName}</span>
							</Masthead>
						</>
					}
				/>

				<div className="relative min-h-0 flex-1">
					<span
						aria-hidden
						className="absolute top-0 left-0 h-full w-px origin-top animate-rule-y bg-border"
						style={{ animationDelay: "180ms" }}
					/>
					<span
						aria-hidden
						className="absolute top-0 right-0 h-full w-px origin-top animate-rule-y bg-border"
						style={{ animationDelay: "180ms" }}
					/>
					{/*
					 * The frame is fixed to the viewport, so the column inside it is what scrolls when
					 * a phone or a 200% zoom leaves no room. `min-h-full` keeps the column optically
					 * centred while there is room and lets it grow past centre when there is not.
					 */}
					{/*
					 * The register runs the width of the page.
					 *
					 * The first build capped this column at 32rem, which left the ruled field block
					 * floating at a third of the frame's width with a thousand pixels of unexplained
					 * paper beside it — a card in all but name, and the exact arrangement the frame
					 * exists to refuse. The rules now cross the whole interior the way a ledger's
					 * do; the entries sit at the left of them, and the blank to their right is a
					 * column deliberately left empty rather than a layout that ran out.
					 */}
					<div className="h-full overflow-y-auto overscroll-contain">
						{/*
						 * The vertical padding yields before the form does, and it yields early.
						 *
						 * The threshold is 1000px rather than something that sounds short, because the
						 * screen this has to fit is a 1280x800 laptop — the most common staff display by
						 * a wide margin, and the majority case rather than an edge one. At full padding
						 * and a full-height plate the column ran past the fold there and left the Sign in
						 * button cut at the scroll boundary: still reachable by scrolling, but a primary
						 * action sitting on the fold is exactly what the Desktop-First, Mobile-Survivable
						 * Rule forbids. Above 1000px the page breathes; below it the rhythm tightens and
						 * the plate scales with the viewport before anything else gives ground.
						 */}
						<div className="flex min-h-full items-center px-5 py-10 sm:px-10 md:px-14 [@media(max-height:1000px)]:py-4">
							{/*
							 * The Eighty-Rem Rule holds inside the frame too. The frame itself may bleed
							 * to the viewport — it is the edge of the page, not content — but a register
							 * rule drawn 2500px across a wide office display is not a longer version of
							 * the same design, it is a different one.
							 */}
							<div className="mx-auto w-full max-w-7xl">
								<Frontispiece />
								{children}
							</div>
						</div>
					</div>
				</div>

				<MastheadRule
					delay="360ms"
					end={<Masthead>Established 1914</Masthead>}
					start={
						<Masthead>
							<span className="hidden sm:inline">{COMPANY_INFO.address}</span>
							<span className="sm:hidden">Edison, NJ</span>
						</Masthead>
					}
				/>
			</div>
		</main>
	);
}

/**
 * The task, named. The destination is already on the rule above, so this says what you are doing
 * here and nothing else — no eyebrow, no repeated application name.
 */
export function AuthHeading({
	title,
	description,
}: {
	title: string;
	description?: string;
}) {
	return (
		<header className="flex flex-col gap-2">
			{/*
			 * One step above the staff Headline and well below the public Display, which is
			 * reserved for a hero over a photograph. This screen holds a single heading and
			 * nothing competing with it, so the page-title size documented for a dense shell
			 * reads undersized inside a full-viewport frame.
			 */}
			<h1 className="font-semibold text-2xl leading-tight tracking-tight sm:text-3xl">
				{title}
			</h1>
			{description && (
				<p className="max-w-prose text-muted-foreground text-sm leading-normal">
					{description}
				</p>
			)}
		</header>
	);
}

/**
 * The ruled block the fields sit in.
 *
 * Two hairlines bracket the entries the way a ledger's columns are closed top and bottom. This is
 * the only structure on the page: no card, no shadow, no tonal step — the frame and these two
 * rules carry everything, which is the Flat-By-Default Rule taken at its word.
 */
export function AuthFieldset({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"mt-8 border-border border-y py-8 [@media(max-height:1000px)]:mt-5 [@media(max-height:1000px)]:py-5",
				className,
			)}
		>
			{/*
			 * The rules span the page; the entries occupy the first column of them. An input
			 * stretched to 1400px is unusable, and a rule stopped at 400px is not a register.
			 */}
			<div className="flex max-w-md flex-col gap-6">{children}</div>
		</div>
	);
}

/**
 * One reserved cell for whatever the screen currently has to say.
 *
 * The height is held whether or not there is a message, so a failed sign-in does not shove the
 * button down the page under the cursor that was about to press it again. Errors are announced;
 * a confirmation is not, because it always follows an action the user just took.
 */
export function AuthStatus({ children }: { children?: React.ReactNode }) {
	return (
		<p
			className="mt-4 min-h-5 max-w-md text-destructive text-sm leading-5"
			role="alert"
		>
			{children}
		</p>
	);
}

/**
 * The action row: the command on the left where the column's measure begins, its escape hatch
 * pushed to the right edge of the same measure. The primary action is never centred and never
 * full-bleed — it is one button in a form, at the system's own 36px.
 */
export function AuthActions({
	children,
	aside,
}: {
	children: React.ReactNode;
	aside?: React.ReactNode;
}) {
	/*
	 * Wider than the entry column so the row spans, but not the frame's full width: a recovery
	 * link a thousand pixels from the button it belongs to is a composition winning an argument
	 * against the task.
	 */
	return (
		<div className="mt-8 flex max-w-2xl flex-wrap items-center justify-between gap-x-6 gap-y-4">
			{children}
			{aside}
		</div>
	);
}

/** The one link treatment these screens use. Quiet until it is wanted. */
export const authLinkClassName =
	"rounded-sm text-muted-foreground text-sm underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";
