import {
	MosquitoActivityCharts,
	type MosquitoActivityRow,
} from "@mcmec/ui/blocks/mosquito-activity-chart";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { mosquitoActivityQueryOptions } from "@/src/lib/queries";

export const Route = createFileRoute("/mosquito-surveillance/weekly-activity")({
	component: RouteComponent,
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(mosquitoActivityQueryOptions());
	},
});

function RouteComponent() {
	const { data: rawData } = useSuspenseQuery(mosquitoActivityQueryOptions());

	const chartData: MosquitoActivityRow[] = useMemo(
		() =>
			rawData.map((d) => ({
				mosquito_count: d.mosquito_count,
				rainfall_inches: d.rainfall_inches,
				species_group: d.species_group,
				species_name: d.species_name,
				week_number: d.week_number,
				year: d.year,
			})),
		[rawData],
	);

	if (chartData.length === 0) {
		return (
			<article className="prose lg:prose-xl max-w-none">
				<h1>Weekly Mosquito Activity</h1>
				<p>
					No mosquito activity data is currently available. Please check back
					soon.
				</p>
			</article>
		);
	}

	return (
		<div className="space-y-6">
			<h1 className="font-bold text-3xl">Weekly Mosquito Activity</h1>
			<MosquitoActivityCharts data={chartData} />
		</div>
	);
}
