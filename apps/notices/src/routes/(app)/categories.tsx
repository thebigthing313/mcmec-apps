import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { notice_types } from "@/src/lib/collections/notice_types";

export const Route = createFileRoute("/(app)/categories")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Categories" };
	},
});

function RouteComponent() {
	const { data: categories } = useLiveQuery((q) =>
		q
			.from({ notice_type: notice_types })
			.orderBy(({ notice_type }) => notice_type.name),
	);

	return categories.map((category) => (
		<div key={category.id}>
			<h2>{category.name}</h2>
			<p>{category.description}</p>
		</div>
	));
}
