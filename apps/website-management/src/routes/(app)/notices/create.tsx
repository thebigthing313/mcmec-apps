import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import {
	NoticeForm,
	type NoticeFormValues,
} from "@/src/components/notice-form";
import { intents, notices, noticeTypes } from "@/src/lib/db";

export const Route = createFileRoute("/(app)/notices/create")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "Create" };
	},
});

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { data: categories } = useLiveQuery((q) =>
		q
			.from({ notice_type: noticeTypes })
			.orderBy(({ notice_type }) => notice_type.name)
			.select(({ notice_type }) => ({
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
		// The id we mint here is the id the row will have: the envelope carries it and the
		// handler honours it, so the optimistic row and the committed row share a key — which
		// is also what lets this navigate straight to the detail route.
		const id = crypto.randomUUID();
		const tx = notices.insert(
			{
				...value,
				created_at: now,
				id,
				is_archived: false,
				updated_at: now,
			},
			intents("website.createNotice"),
		);
		toastOnError(tx, "Failed to create notice.");
		navigate({ params: { noticeId: id }, to: "/notices/$noticeId" });
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
			formLabel="Create Notice"
			mode="create"
			onSubmit={handleSubmit}
			submitLabel="Create as Draft"
		/>
	);
}
