import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { useLiveQuery } from "@tanstack/react-db";
import { getRouteApi } from "@tanstack/react-router";
import {
	NoticeForm,
	type NoticeFormValues,
} from "@/src/apps/website-management/components/notice-form";
import { intents } from "@/src/lib/intents";

const route = getRouteApi("/(app)/website-management/notices/create");

export function CreateNoticePage() {
	const { notices, noticeTypes } = route.useRouteContext();
	const navigate = route.useNavigate();
	const { data: categories } = useLiveQuery(
		(q) =>
			q
				.from({ notice_type: noticeTypes })
				.orderBy(({ notice_type }) => notice_type.name)
				.select(({ notice_type }) => ({
					id: notice_type.id,
					name: notice_type.name,
				})),
		[noticeTypes],
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
		navigate({
			params: { noticeId: id },
			to: "/website-management/notices/$noticeId",
		});
	};

	return (
		<div>
			<PageHeader title="Create Notice" />
			<NoticeForm
				categories={items}
				defaultValues={{
					content: "",
					notice_date: new Date(),
					notice_type_id: "",
					title: "",
				}}
				mode="create"
				onSubmit={handleSubmit}
				submitLabel="Create as Draft"
			/>
		</div>
	);
}
