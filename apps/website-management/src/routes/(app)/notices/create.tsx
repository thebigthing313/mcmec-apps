import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import {
	NoticeForm,
	type NoticeFormValues,
} from "@/src/components/notice-form";
import { intents, notices, noticeTypes } from "@/src/lib/db";
import { toastOnError } from "@/src/lib/toast-on-error";

export const Route = createFileRoute("/(app)/notices/create")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Create New Notice" };
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { data: categories } = useLiveQuery((q) =>
		q.from({ notice_type: noticeTypes }).select(({ notice_type }) => ({
			id: notice_type.id,
			name: notice_type.name,
		})),
	);

	const items = categories.map((category) => ({
		label: category.name,
		value: category.id,
	}));

	const handleSubmit = async (value: NoticeFormValues) => {
		const now = new Date();
		const tx = notices.insert(
			{
				...value,
				created_at: now,
				// The id we mint here is the id the row will have: the envelope carries it and
				// the handler honours it. Under the old path it was thrown away server-side, so
				// the optimistic row and the committed row had different keys on every insert.
				id: crypto.randomUUID(),
				is_archived: false,
				updated_at: now,
			},
			intents("website.createNotice"),
		);
		toastOnError(tx, "Failed to create notice.");
		navigate({ to: "/notices" });
	};

	return (
		<NoticeForm
			categories={items}
			defaultValues={{
				content: "",
				notice_date: new Date(),
				notice_type_id: "",
				title: "",
			}}
			formLabel="Create New Notice"
			mode="create"
			onSubmit={handleSubmit}
			submitLabel="Create"
		/>
	);
}
