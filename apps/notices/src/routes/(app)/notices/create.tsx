import type { NoticesRowType } from "@mcmec/supabase/db/notices";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { NoticeForm } from "@/src/components/notice-form";
import { notice_types } from "@/src/lib/collections/notice_types";
import { notices } from "@/src/lib/collections/notices";

export const Route = createFileRoute("/(app)/notices/create")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Create New Notice" };
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { data: categories } = useLiveQuery((q) =>
		q
			.from({ notice_type: notice_types })
			.orderBy(({ notice_type }) => notice_type.name),
	);

	const items = categories.map((category) => ({
		label: category.name,
		value: category.id,
	}));

	const handleSubmit = async (value: NoticesRowType) => {
		notices.insert(value);
		navigate({ to: "/notices" });
	};

	return (
		<NoticeForm
			categories={items}
			defaultValues={{
				content: "",
				created_at: new Date(),
				created_by: null,
				id: crypto.randomUUID(),
				is_archived: false,
				is_published: true,
				notice_date: new Date(),
				notice_type_id: "",
				title: "",
				updated_at: new Date(),
				updated_by: null,
			}}
			formLabel="Create New Notice"
			onSubmit={handleSubmit}
			submitLabel="Create"
		/>
	);
}
