import type { InsecticideTableRowType } from "@mcmec/ui/blocks/insecticides-table";
import { InsecticidesTable } from "@mcmec/ui/blocks/insecticides-table";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { insecticidesQueryOptions } from "@/src/lib/queries";

export const Route = createFileRoute("/(about)/mosquito-control-products")({
	component: RouteComponent,
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(insecticidesQueryOptions());
	},
});

function RouteComponent() {
	const { data: insecticidesData } = useSuspenseQuery(
		insecticidesQueryOptions(),
	);

	const tableData: InsecticideTableRowType[] = insecticidesData.map(
		(insecticide) => ({
			active_ingredient: insecticide.active_ingredient,
			active_ingredient_url: insecticide.active_ingredient_url,
			id: insecticide.id,
			label_url: insecticide.label_url,
			msds_url: insecticide.msds_url,
			trade_name: insecticide.trade_name,
			type_name: insecticide.type_name,
		}),
	);

	return (
		<div className="mx-auto w-full max-w-7xl p-4">
			<article className="prose lg:prose-xl max-w-none">
				<h1>Commonly Used Mosquito Control Products</h1>
				<p>
					The Commission uses insecticides with low environmental risk for
					controlling mosquitoes. All insecticides used comply with state and
					federal requirements and are consistent with the recommendations
					provided by the New Jersey Agricultural Experiment Station, Rutgers
					University:{" "}
					<a
						href="https://vectorbio.rutgers.edu/outreach/docs/bmpmcnj.pdf"
						rel="noopener noreferrer"
						target="_blank"
					>
						"Insecticides Recommended For Mosquito Control in New Jersey in
						2012" publication #P-08001-01-12.
					</a>
				</p>
			</article>
			<div className="mt-8">
				<InsecticidesTable data={tableData} linkToEdit={false} />
			</div>
		</div>
	);
}
