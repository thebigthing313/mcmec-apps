import { useIsMobile } from "@mcmec/ui/hooks/use-mobile";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

function RouteComponent() {
	const isMobile = useIsMobile();

	return (
		<div className="-my-8 w-full">
			{/* h-[calc(100vh-152px)] = 100vh - navbar(~120px) - sliver(32px) */}
			<div className="relative h-[calc(100vh-152px)] w-full overflow-hidden">
				<img
					alt="Woodbridge River cleanup project"
					className="absolute inset-0 h-full w-full object-cover"
					fetchPriority="high"
					src={isMobile ? "/shared/hero-mobile.avif" : "/shared/hero.avif"}
				/>

				{/* Dark gradient overlay */}
				<div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-transparent" />

				{/* Bottom gradient for smooth transition */}
				<div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-black/60 to-transparent" />

				{/* Content Centering Wrapper */}
				<div className="absolute inset-0 flex items-center justify-start p-6 md:p-12">
					<div className="max-h-[90%] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/20 bg-black/30 p-6 shadow-2xl backdrop-blur-md md:ml-12 md:p-10">
						<article className="space-y-6 text-white leading-relaxed">
							<p>
								<span className="mb-2 block font-bold text-3xl tracking-tight">
									The Middlesex County Mosquito Extermination Commission
								</span>
								<span className="text-white/90">
									was created in 1914. In accordance with the laws of the State
									of New Jersey, N.J.S.A, Title 26, Chapter 9 and 26:3-46 et.
									seq., the Commission is "to perform all acts which, in its
									opinion, may be necessary for the elimination of mosquito
									breeding areas, or which will tend to exterminate mosquitoes
									within the county.
								</span>
							</p>
							<p className="text-white/90">
								The Commission recognizes mosquito-borne diseases to be
								hazardous to the health and safety of the people of Middlesex
								County and is committed to reducing the chance of infection
								through a comprehensive approach to mosquito control. This
								approach in in accordance with scientifically based best
								management practices and includes mosquito surveillance, water
								management, biological control, chemical control and public
								education.
							</p>
						</article>
					</div>
				</div>

				{/* Scroll indicator with bounce animation */}
				<div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce">
					<ChevronDown className="h-8 w-8 text-white/70" />
				</div>
			</div>
		</div>
	);
}
