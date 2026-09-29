import type { CommandName } from "@mcmec/domain";
import { LifecycleButton } from "@mcmec/ui/blocks/lifecycle-button";
import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { rowVersion, useFormSeed } from "@mcmec/ui/hooks/use-form-seed";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { getRouteApi } from "@tanstack/react-router";
import {
	type NoticeDetailValues,
	NoticeForm,
	type NoticeFormValues,
} from "@/src/apps/website-management/components/notice-form";
import {
	changedFields,
	type Draft,
	runLifecycle,
} from "@/src/apps/website-management/lib/lifecycle";
import type { CentralCollection } from "@/src/lib/collections";
import { intents } from "@/src/lib/intents";

const route = getRouteApi("/(app)/website-management/notices/$noticeId_/edit");

type NoticeDraft = Draft<CentralCollection<"notices">>;

/** Exactly the fields `website.updateNoticeDetails` accepts — the Save half of a Save-and-X. */
function detailValues(value: NoticeDetailValues) {
	return {
		content: value.content,
		notice_date: value.notice_date,
		notice_type_id: value.notice_type_id,
		title: value.title,
	};
}

export function EditNoticePage() {
	const { notices, noticeTypes } = route.useRouteContext();
	const navigate = route.useNavigate();
	const { notice: loadedNotice } = route.useLoaderData();
	const { noticeId } = route.useParams();

	// Seed from the live row, not the loader's one-shot read — see @mcmec/ui/hooks/use-form-seed.
	const { data: liveNotices } = useLiveQuery(
		(q) =>
			q
				.from({ notice: notices })
				.where(({ notice }) => eq(notice.id, noticeId)),
		[notices, noticeId],
	);
	const notice = liveNotices[0] ?? loadedNotice;
	const { seedKey, latchProps } = useFormSeed(rowVersion(notice));

	const { data: categories } = useLiveQuery(
		(q) =>
			q
				.from({ notice_type: noticeTypes })
				.orderBy(({ notice_type }) => notice_type.name),
		[noticeTypes],
	);

	const items = categories.map((category) => ({
		label: category.name,
		value: category.id,
	}));

	const handleSubmit = async (value: NoticeFormValues) => {
		const tx = notices.update(
			noticeId,
			intents("website.updateNoticeDetails"),
			(draft) => {
				Object.assign(draft, detailValues(value));
			},
		);
		toastOnError(tx, "Failed to update notice.");
		navigate({
			params: { noticeId },
			to: "/website-management/notices/$noticeId",
		});
	};

	return (
		<div className="space-y-4" {...latchProps}>
			<PageHeader title="Edit Notice" />
			<NoticeForm
				actions={({ values }) => {
					// Diffed against the LIVE row, so the label and the payload cannot disagree: if
					// this is empty the button stays "Publish" and sends one intent, and
					// `updateNoticeDetails` is never handed a payload its own non-empty refinement
					// would refuse.
					const changes = changedFields(detailValues(values), notice);
					const isDirty = Object.keys(changes).length > 0;

					// One request, both intents, one transaction. A refused archive rolls the field
					// save back with it — which is the sentence `savedTogether` adds to the toast.
					const act =
						(
							command: CommandName,
							apply: (draft: NoticeDraft) => void,
							failure: string,
						) =>
						(withSave: boolean) =>
							runLifecycle(notices, noticeId, {
								apply,
								command,
								failure,
								save: withSave
									? { changes, command: "website.updateNoticeDetails" }
									: undefined,
							});

					const publish = notice.is_published
						? {
								label: "Unpublish",
								onAct: act(
									"website.unpublishNotice",
									(draft) => {
										draft.is_published = false;
									},
									"Failed to unpublish notice.",
								),
							}
						: {
								label: "Publish",
								onAct: act(
									"website.publishNotice",
									(draft) => {
										draft.is_published = true;
									},
									"Failed to publish notice.",
								),
							};

					// The server owns P.L. 2025 c.72, so this button does not know the rule — a
					// refusal arrives as a 409 written for the person who clicked.
					const archive = notice.is_archived
						? {
								label: "Unarchive",
								onAct: act(
									"website.unarchiveNotice",
									(draft) => {
										draft.is_archived = false;
									},
									"Failed to unarchive notice.",
								),
							}
						: {
								label: "Archive",
								onAct: act(
									"website.archiveNotice",
									(draft) => {
										draft.is_archived = true;
									},
									"Failed to archive notice.",
								),
							};

					return (
						<div className="flex gap-2">
							{[publish, archive].map(({ label, onAct }) => (
								<LifecycleButton
									className="flex-1"
									isDirty={isDirty}
									key={label}
									label={label}
									onAct={onAct}
								/>
							))}
						</div>
					);
				}}
				categories={items}
				defaultValues={{
					content: notice.content,
					notice_date: new Date(notice.notice_date),
					notice_type_id: notice.notice_type_id,
					title: notice.title,
				}}
				key={seedKey}
				mode="edit"
				onSubmit={handleSubmit}
				submitLabel="Update"
			/>
		</div>
	);
}
