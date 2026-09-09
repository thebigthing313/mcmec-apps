import {
	heroBuilding,
	heroHelicopter,
	heroLab,
	heroOutreach,
	heroTires,
	heroWaterManagement,
} from "@mcmec/lib/constants/assets";
import { cn } from "@mcmec/ui/lib/utils";
import { Pause, Play } from "lucide-react";
import { type CSSProperties, useCallback, useEffect, useState } from "react";

/**
 * The home page's hero plate: six photographs of the Commission's own work, crossfading.
 *
 * Three decisions are load-bearing and should survive a redesign of everything around them.
 *
 * **No content is laid over the photograph.** No scrim, no gradient, no heading floating on
 * the image. That is the same licence the auth frame's building plate takes, and it is why the
 * heading beside it can be Ink on Paper instead of white text fighting a photo for 4.5:1.
 *
 * The controls are the one thing that sits on the image, and they bring their own ground: an
 * opaque Paper plaque with a Rule border, so every ratio inside it is measured against a colour
 * we chose rather than against whatever pixel of sky or gravel happens to be underneath. That
 * is the difference between a control on a photograph and a control in a photograph.
 *
 * **The progress meter is the system's drawn rule.** `animate-rule-x` is the one authored
 * gesture `globals.css` owns, reused here at the dwell duration on a linear curve — a meter
 * has to be honest about time, so it does not take the exponential settle the auth frame's
 * rules do. It also inherits that token's `prefers-reduced-motion` override for free: the
 * animation is removed, which leaves the hairline at its untransformed full width.
 *
 * **Auto-advance is a WCAG 2.2.2 obligation, not a preference.** Motion that starts on its own
 * and runs past five seconds needs a mechanism to pause it, so the pause control is not
 * optional chrome and is never hidden behind a hover. Reduced motion additionally means the
 * plate does not start moving at all.
 */

const DWELL_MS = 6000;
const FADE_MS = 900;

interface Slide {
	src: string;
	/** Screen-reader description. The plate carries no visible caption by design. */
	alt: string;
	/**
	 * Chosen per photograph, never left at `center`. These are working snapshots, not art
	 * direction — half of them put a third of the frame in empty sky, and a centred crop of
	 * `hero-tires` lands on power lines with the loader cut off at the knees.
	 */
	position: string;
}

const slides: Slide[] = [
	{
		alt: "The Commission's headquarters at 200 Parsonage Road in Edison, New Jersey.",
		// The building runs to 59% of the frame and the road sign from 62% to the edge; a
		// centred crop keeps neither whole and cuts the sign mid-word. Favour the building.
		position: "42% 50%",
		src: heroBuilding,
	},
	{
		alt: "A helicopter on the Commission's landing pad, used for aerial larviciding.",
		position: "50% 54%",
		src: heroHelicopter,
	},
	{
		alt: "An excavator clearing a drainage ditch during water management work.",
		position: "55% 55%",
		src: heroWaterManagement,
	},
	{
		alt: "A staff member examining mosquito specimens under a microscope in the Commission's laboratory.",
		position: "50% 58%",
		src: heroLab,
	},
	{
		alt: "A staff member loading discarded tires, a common mosquito breeding source, into a grapple.",
		position: "45% 62%",
		src: heroTires,
	},
	{
		alt: "The Commission's information table at a community outreach event.",
		position: "50% 56%",
		src: heroOutreach,
	},
];

export function HeroCarousel() {
	// `previous` stays fully opaque underneath the incoming slide. Fading one image out while
	// the next fades in shows the ground through both at the midpoint; stacking them does not.
	const [{ index, previous }, setSlide] = useState({ index: 0, previous: -1 });
	const [playing, setPlaying] = useState(true);
	const [reduced, setReduced] = useState(false);

	useEffect(() => {
		const query = window.matchMedia("(prefers-reduced-motion: reduce)");
		setReduced(query.matches);
		const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
		query.addEventListener("change", onChange);
		return () => query.removeEventListener("change", onChange);
	}, []);

	const show = useCallback((next: number) => {
		setSlide((current) =>
			next === current.index
				? current
				: { index: next, previous: current.index },
		);
	}, []);

	// Keyed on `index`, so choosing a photograph by hand restarts the dwell rather than
	// leaving the next advance to fire a moment later.
	useEffect(() => {
		if (!playing || reduced) return;
		const timer = window.setTimeout(
			() => show((index + 1) % slides.length),
			DWELL_MS,
		);
		return () => window.clearTimeout(timer);
	}, [index, playing, reduced, show]);

	const running = playing && !reduced;

	/*
	 * Stacked, the photograph is a band across the page and its aspect flattens as the page
	 * widens — a 4:3 crop at 1024px would be 768px of photograph before a visitor reached
	 * anything. Beside the register at `xl` it takes the column's own height instead.
	 */
	return (
		<div className="relative aspect-4/3 overflow-hidden bg-muted sm:aspect-16/9 lg:aspect-21/9 xl:aspect-auto xl:min-h-[34rem]">
			{/*
			 * `aria-live` is off while the plate advances on its own, so a screen reader is not
			 * interrupted every six seconds; polite once the visitor has taken control, where
			 * the announcement is the answer to something they just did. The controls sit
			 * outside this region — they are not the thing that changed.
			 */}
			<section
				aria-label="Photographs of the Commission's work"
				aria-live={running ? "off" : "polite"}
				aria-roledescription="carousel"
				className="absolute inset-0"
			>
				{slides.map((slide, position) => {
					const isCurrent = position === index;
					const isOutgoing = position === previous;
					return (
						<img
							alt={slide.alt}
							aria-hidden={!isCurrent}
							className={cn(
								"absolute inset-0 size-full object-cover transition-opacity ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
								isCurrent && "z-20 opacity-100",
								isOutgoing && "z-10 opacity-100",
								!(isCurrent || isOutgoing) && "z-0 opacity-0",
							)}
							decoding={position === 0 ? "sync" : "async"}
							fetchPriority={position === 0 ? "high" : "low"}
							key={slide.src}
							loading={position === 0 ? "eager" : "lazy"}
							src={slide.src}
							style={{
								objectPosition: slide.position,
								transitionDuration: `${FADE_MS}ms`,
							}}
						/>
					);
				})}
			</section>

			{/*
			 * The plaque. A card's corner and border, an opaque Paper ground, and the system's
			 * own resting shadow — the one place the Flat-By-Default Rule yields, because this
			 * element genuinely is above the surface behind it rather than pretending to be.
			 */}
			<div className="absolute right-4 bottom-4 z-30 flex items-center gap-2 rounded-xl border bg-background py-1.5 pr-1.5 pl-3 shadow-sm sm:right-6 sm:bottom-6">
				<div className="flex items-center gap-1.5">
					{slides.map((slide, position) => (
						<button
							aria-current={position === index ? "true" : undefined}
							aria-label={`Show photograph ${position + 1} of ${slides.length}`}
							className="group flex w-6 items-center rounded-xs py-3 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
							key={slide.src}
							onClick={() => show(position)}
							type="button"
						>
							{/*
							 * Two contrasts to satisfy, not one, and the first version only
							 * satisfied the first.
							 *
							 * The track is Muted Ink rather than Rule because these hairlines are
							 * the only visual the tick buttons have, so WCAG 1.4.11 asks 3:1 of
							 * them against the plaque's Paper — Rule measures 1.7:1 and would make
							 * the control invisible to the people the criterion exists for. Muted
							 * Ink reads 7.06:1.
							 *
							 * But the *selected* tick then fills in Commission Green **over that
							 * track**, and green on Muted Ink measures 1.19:1 — so the mark that
							 * says which photograph is showing was invisible against the thing it
							 * was drawn on, which is the same failure one layer down. The selected
							 * tick's track drops to Pale Green, where the fill reads 3.83:1, and
							 * it thickens to 4px so the state is also carried by size and not by
							 * contrast alone.
							 */}
							<span
								className={cn(
									"block w-full overflow-hidden transition-colors",
									position === index
										? "h-1 bg-secondary"
										: "h-0.5 bg-muted-foreground/90 group-hover:bg-foreground",
								)}
							>
								{position === index ? (
									<span
										className={cn(
											"block h-full w-full origin-left bg-primary",
											running
												? "animate-rule-x [animation-duration:var(--hero-dwell)] [animation-timing-function:linear]"
												: "scale-x-100",
										)}
										key={index}
										style={{ "--hero-dwell": `${DWELL_MS}ms` } as CSSProperties}
									/>
								) : null}
							</span>
						</button>
					))}
				</div>

				<button
					aria-label={
						playing ? "Pause the photographs" : "Play the photographs"
					}
					className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
					onClick={() => setPlaying((current) => !current)}
					type="button"
				>
					{playing ? <Pause className="size-4" /> : <Play className="size-4" />}
				</button>
			</div>
		</div>
	);
}
