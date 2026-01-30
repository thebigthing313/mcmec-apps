import type { InsecticideTableRowType } from "@mcmec/ui/blocks/insecticides-table";
import { InsecticidesTable } from "@mcmec/ui/blocks/insecticides-table";
import { Button } from "@mcmec/ui/components/button";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { insecticides } from "@/src/lib/collections/insecticides";

export const Route = createFileRoute("/(app)/insecticides/")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Insecticides" };
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { data: insecticidesData } = useLiveQuery((q) =>
		q.from({ insecticide: insecticides }),
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

	const handleRowClick = (insecticideId: string) => {
		navigate({ to: `/insecticides/${insecticideId}` });
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="font-semibold text-2xl">Insecticides</h1>
				<Button onClick={() => navigate({ to: "/insecticides/create" })}>
					Add Insecticide
				</Button>
			</div>
			<InsecticidesTable
				data={tableData}
				linkToEdit={true}
				onRowClick={handleRowClick}
			/>
		</div>
	);
}
