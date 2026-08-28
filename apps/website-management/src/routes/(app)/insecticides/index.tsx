import {
	RecordIndex,
	type RecordIndexColumn,
	type RecordIndexSearch,
} from "@mcmec/ui/blocks/record-index";
import { Button } from "@mcmec/ui/components/button";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, SprayCan } from "lucide-react";
import { insecticides } from "@/src/lib/db";

type InsecticideRow = {
	id: string;
	tradeName: string;
	typeName: string;
	activeIngredient: string;
	activeIngredientUrl: string;
	labelUrl: string;
	msdsUrl: string;
};

export const Route = createFileRoute("/(app)/insecticides/")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Insecticides" };
	},
	validateSearch: (
		raw: Partial<Record<keyof RecordIndexSearch, unknown>>,
	): Partial<RecordIndexSearch> => ({
		...(typeof raw.q === "string" && raw.q ? { q: raw.q } : {}),
		...(Number(raw.page) > 1 ? { page: Number(raw.page) } : {}),
		...(Number(raw.size) ? { size: Number(raw.size) } : {}),
		...(typeof raw.sort === "string" && raw.sort ? { sort: raw.sort } : {}),
		...(raw.dir === "asc" || raw.dir === "desc" ? { dir: raw.dir } : {}),
	}),
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const search = Route.useSearch();
	const { data, collection } = useLiveQuery((q) =>
		q.from({ insecticide: insecticides }),
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
				<Button onClick={() => navigate({ to: "/insecticides/create" })}>
					<Plus />
					Add Insecticide
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
					to: "/insecticides",
				})
			}
			renderRowLink={({ row, className, children }) => (
				<Link
					className={className}
					params={{ insecticideId: row.id }}
					to="/insecticides/$insecticideId"
				>
					{children}
				</Link>
			)}
			rows={rows}
			search={search}
			searchPlaceholder="Search insecticides"
			state={collection.isReady() ? "ready" : "loading"}
			title="Insecticides"
		/>
	);
}
