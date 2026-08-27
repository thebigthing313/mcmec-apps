import type { InsecticideTableRowType } from "@mcmec/ui/blocks/insecticides-table";
import { InsecticidesTable } from "@mcmec/ui/blocks/insecticides-table";
import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { Button } from "@mcmec/ui/components/button";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { insecticides } from "@/src/lib/db";

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
		navigate({ params: { insecticideId }, to: "/insecticides/$insecticideId" });
	};

	return (
		<div className="space-y-4">
			<PageHeader
				actions={
					<Button onClick={() => navigate({ to: "/insecticides/create" })}>
						Add Insecticide
					</Button>
				}
				title="Insecticides"
			/>
			<InsecticidesTable
				data={tableData}
				linkToDetail={true}
				onRowClick={handleRowClick}
			/>
		</div>
	);
}
