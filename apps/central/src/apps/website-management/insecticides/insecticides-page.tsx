import {
	RecordIndex,
	type RecordIndexColumn,
} from "@mcmec/ui/blocks/record-index";
import { Button } from "@mcmec/ui/components/button";
import { useLiveQuery } from "@tanstack/react-db";
import { getRouteApi, Link } from "@tanstack/react-router";
import { Edit, Plus, SprayCan } from "lucide-react";

type InsecticideRow = {
	id: string;
	tradeName: string;
	typeName: string;
	activeIngredient: string;
	activeIngredientUrl: string;
	labelUrl: string;
	msdsUrl: string;
};

const route = getRouteApi("/(app)/website-management/insecticides/");

export function InsecticidesPage() {
	const { insecticides } = route.useRouteContext();
	const navigate = route.useNavigate();
	const search = route.useSearch();
	const { data, collection } = useLiveQuery(
		(q) => q.from({ insecticide: insecticides }),
		[insecticides],
	);

	const rows: InsecticideRow[] = (data ?? []).map((insecticide) => ({
		activeIngredient: insecticide.active_ingredient,
		activeIngredientUrl: insecticide.active_ingredient_url,
		id: insecticide.id,
		labelUrl: insecticide.label_url,
		msdsUrl: insecticide.msds_url,
		tradeName: insecticide.trade_name,
		typeName: insecticide.type_name,
	}));

	const columns: RecordIndexColumn<InsecticideRow>[] = [
		{
			cell: (row) => row.tradeName,
			header: "Trade Name",
			id: "tradeName",
			identity: true,
			sortValue: (row) => row.tradeName,
		},
		{
			cell: (row) => (
				<span className="text-muted-foreground">{row.typeName}</span>
			),
			header: "Type",
			id: "typeName",
			sortValue: (row) => row.typeName,
		},
		{
			cell: (row) => (
				<a
					className="text-primary text-sm hover:underline"
					href={row.activeIngredientUrl}
					rel="noopener noreferrer"
					target="_blank"
				>
					{row.activeIngredient}
				</a>
			),
			header: "Active Ingredient",
			id: "activeIngredient",
			sortValue: (row) => row.activeIngredient,
		},
		{
			// Label and SDS are the two documents the public catalogue links, and the pair is the
			// reason an Insecticide is listed at all — a resident asking what was sprayed is
			// asking for these.
			cell: (row) => (
				<div className="flex flex-wrap gap-2">
					<a
						className="text-primary text-sm hover:underline"
						href={row.labelUrl}
						rel="noopener noreferrer"
						target="_blank"
					>
						Label
					</a>
					<a
						className="text-primary text-sm hover:underline"
						href={row.msdsUrl}
						rel="noopener noreferrer"
						target="_blank"
					>
						SDS
					</a>
				</div>
			),
			header: "Documents",
			id: "documents",
		},
	];

	return (
		<RecordIndex
			actions={
				<Button
					onClick={() =>
						navigate({ to: "/website-management/insecticides/create" })
					}
				>
					<Plus />
					Create Insecticide
				</Button>
			}
			columns={columns}
			defaultSort={{ dir: "asc", id: "tradeName" }}
			description="The products the Commission applies, with the label and safety data sheet the public catalogue links to."
			emptyState={{
				description:
					"Insecticides listed here appear in the public catalogue with their label and SDS.",
				icon: SprayCan,
				title: "No insecticides listed",
			}}
			getRowKey={(row) => row.id}
			getRowLabel={(row) => `${row.tradeName}, ${row.typeName}`}
			getSearchText={(row) =>
				`${row.tradeName} ${row.typeName} ${row.activeIngredient}`
			}
			onSearchChange={(next) =>
				navigate({
					search: { ...search, ...next },
					to: "/website-management/insecticides",
				})
			}
			renderRowLink={({ row, className, children }) => (
				<Link
					className={className}
					params={{ insecticideId: row.id }}
					search={search}
					to="/website-management/insecticides/$insecticideId"
				>
					{children}
				</Link>
			)}
			// An Insecticide is edited far more often than it is read — a label PDF moves, a trade
			// name changes — and without a row action that edit was three navigations for what is
			// a URL change. Every other register in this app offers Edit from the row.
			rowActions={(row) => [
				{
					icon: <Edit />,
					label: "Edit",
					onAct: () =>
						navigate({
							params: { insecticideId: row.id },
							to: "/website-management/insecticides/$insecticideId/edit",
						}),
				},
			]}
			rows={rows}
			search={search}
			searchPlaceholder="Search insecticides"
			state={collection.isReady() ? "ready" : "loading"}
			title="Insecticides"
		/>
	);
}
