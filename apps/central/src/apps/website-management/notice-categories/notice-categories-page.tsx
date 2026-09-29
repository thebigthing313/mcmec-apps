import {
	RecordIndex,
	type RecordIndexColumn,
} from "@mcmec/ui/blocks/record-index";
import { Button } from "@mcmec/ui/components/button";
import { count, eq, useLiveQuery } from "@tanstack/react-db";
import { getRouteApi, Link } from "@tanstack/react-router";
import { Edit, Plus, Tags } from "lucide-react";

type CategoryRow = {
	id: string;
	name: string;
	description: string | null;
	notices: number;
};

const route = getRouteApi("/(app)/website-management/notice-categories/");

export function NoticeCategoriesPage() {
	const { notices, noticeTypes } = route.useRouteContext();
	const navigate = route.useNavigate();
	const search = route.useSearch();

	const { data, collection } = useLiveQuery(
		(q) =>
			q
				.from({ notice_type: noticeTypes })
				.leftJoin({ notice: notices }, ({ notice_type, notice }) =>
					eq(notice_type.id, notice.notice_type_id),
				)
				.groupBy(({ notice_type }) => [
					notice_type.id,
					notice_type.name,
					notice_type.description,
				])
				.select(({ notice_type, notice }) => ({
					description: notice_type.description,
					id: notice_type.id,
					name: notice_type.name,
					notices: count(notice?.id),
				})),
		[noticeTypes, notices],
	);

	const rows: CategoryRow[] = data ?? [];

	const columns: RecordIndexColumn<CategoryRow>[] = [
		{
			cell: (row) => row.name,
			header: "Name",
			id: "name",
			identity: true,
			sortValue: (row) => row.name,
		},
		{
			cell: (row) => (
				<span className="text-muted-foreground">{row.description ?? "—"}</span>
			),
			cellClassName: "max-w-[48ch] truncate",
			header: "Description",
			id: "description",
			sortValue: (row) => row.description ?? "",
		},
		{
			align: "end",
			cell: (row) => row.notices,
			header: "Notices",
			id: "notices",
			sortValue: (row) => row.notices,
		},
	];

	return (
		<RecordIndex
			actions={
				<Button
					onClick={() =>
						navigate({ to: "/website-management/notice-categories/create" })
					}
				>
					<Plus />
					Create Notice Category
				</Button>
			}
			columns={columns}
			defaultSort={{ dir: "asc", id: "name" }}
			description="The types a Notice can be filed under, and how many Notices each one holds."
			emptyState={{
				description:
					"A Notice has to be filed under a category, so this register is where a new kind of notice starts.",
				icon: Tags,
				title: "No notice categories",
			}}
			getRowKey={(row) => row.id}
			getRowLabel={(row) => row.name}
			getSearchText={(row) => `${row.name} ${row.description ?? ""}`}
			onSearchChange={(next) =>
				navigate({
					search: { ...search, ...next },
					to: "/website-management/notice-categories",
				})
			}
			renderRowLink={({ row, className, children }) => (
				<Link
					className={className}
					params={{ categoryId: row.id }}
					search={search}
					to="/website-management/notice-categories/$categoryId"
				>
					{children}
				</Link>
			)}
			// Edit only. `deleteNoticeCategory` is not offered here — ADR 0001 keeps delete in the
			// danger zone on the detail page, where the count of what it would take with it is
			// already on screen.
			rowActions={(row) => [
				{
					icon: <Edit />,
					label: "Edit",
					onAct: () =>
						navigate({
							params: { categoryId: row.id },
							to: "/website-management/notice-categories/$categoryId/edit",
						}),
				},
			]}
			rows={rows}
			search={search}
			searchPlaceholder="Search categories"
			state={collection.isReady() ? "ready" : "loading"}
			title="Notice Categories"
		/>
	);
}
