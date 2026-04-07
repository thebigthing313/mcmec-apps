import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/mosquito-control/aerial-larviciding-notice",
)({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<article className="prose lg:prose-base max-w-none">
			<h1>Aerial Larvicide Treatment Notice</h1>
			<p>
				To control mosquitoes, the Middlesex County Mosquito Extermination
				Commission routinely inspects and treats by helicopter non-residential
				areas including marshes, wetlands and other large natural areas, which
				are common habitats for mosquitoes. Granules containing natural bacteria
				or chemical are dropped from a low-flying helicopter to kill mosquito
				larvae before they grow into adult mosquitoes. Due to their size and
				inaccessibility by ground vehicles, these areas are treated when
				necessary pursuant to heavy rainfall or tidal events.
			</p>
			<p>
				You may see our helicopter flying over residential areas. However, no
				applications are made over residential neighborhoods. The pilot is
				merely positioning the helicopter to approach the wetlands in nearby
				areas.
			</p>
			<p>
				To view our aerial treatment locations, please{" "}
				<a
					href="https://www.google.com/maps/d/u/0/viewer?mid=1405E_kiyQ4_fjzdJn9jkFzY7SQE&ll=40.43034941206448%2C-74.416975&z=11"
					rel="noopener noreferrer"
					target="_blank"
				>
					click here
				</a>
				.
			</p>
			<p>
				<strong>PLEASE NOTE: THIS IS NOT A "SPRAYING" ACTIVITY.</strong>
			</p>
			<p>
				No precautions are recommended for this treatment. Human exposure to
				product is very minimal.
			</p>

			<h2>Method of Application</h2>
			<p>
				Low altitude, granular application using a helicopter over uninhabited
				wetland areas located throughout Middlesex County.
			</p>

			<h2>Mosquito Control Products</h2>
			<ul>
				<li>
					<strong>
						<a
							href="https://npic.orst.edu/factsheets/BTgen.pdf"
							rel="noopener noreferrer"
							target="_blank"
						>
							Bacillus thuringiensis israelensis (Bti)
						</a>
						:
					</strong>{" "}
					a biological larvicide
				</li>
				<li>
					<strong>
						<a
							href="https://npic.orst.edu/factsheets/spinosadgen.html"
							rel="noopener noreferrer"
							target="_blank"
						>
							Spinosad
						</a>
						:
					</strong>{" "}
					a biologically derived larvicide
				</li>
			</ul>

			<p>
				If conditions are not ideal, treatments will not be conducted. For more
				information, please <Link to="/contact/contact-us">contact us</Link>.
			</p>
		</article>
	);
}
