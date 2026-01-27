import { AspectRatio } from "@mcmec/ui/components/aspect-ratio";
import { useIsMobile } from "@mcmec/ui/hooks/use-mobile";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

function RouteComponent() {
	const isMobile = useIsMobile();
	const countyUrl =
		"https://www.middlesexcountynj.gov/government/departments/department-of-public-safety-and-health/middlesex-county-mosquito-commission";

	return (
		<div className="-my-8 w-full">
			<AspectRatio ratio={isMobile ? 3 / 4 : 21 / 9}>
				<img
					alt="Woodbridge River cleanup project"
					className="h-full w-full object-cover"
					fetchPriority="high"
					src={isMobile ? "/shared/hero-mobile.avif" : "/shared/hero.avif"}
				/>
				<div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-transparent" />
				<div className="absolute inset-0 flex items-center justify-start p-6 md:p-12">
					<div className="my-4 max-h-[90%] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/20 bg-black/30 p-6 shadow-2xl backdrop-blur-md md:ml-12 md:p-10">
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
			</AspectRatio>
		</div>
	);
}
