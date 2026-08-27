import type { CommandName } from "@mcmec/domain";
import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { LifecycleButton } from "@mcmec/ui/blocks/lifecycle-button";
import { rowVersion, useFormSeed } from "@mcmec/ui/hooks/use-form-seed";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import {
	NoticeForm,
	type NoticeFormValues,
} from "@/src/components/notice-form";
import { intents, notices, noticeTypes } from "@/src/lib/db";
import { changedFields, type Draft, runLifecycle } from "@/src/lib/lifecycle";

export const Route = createFileRoute("/(app)/notices/$noticeId_/edit")({
	component: RouteComponent,
	loader: async ({ params }) => {
		await Promise.all([notices.preload(), noticeTypes.preload()]);
		const notice = notices.get(params.noticeId);
		if (!notice) {
			throw new Error(ErrorMessages.DATABASE.RECORD_NOT_AVAILABLE);
		}
		return { crumb: "Edit", notice };
	},
});

type NoticeDraft = Draft<typeof notices>;

/** Exactly the fields `website.updateNoticeDetails` accepts — the Save half of a Save-and-X. */
function detailValues(value: NoticeFormValues) {
	return {
		content: value.content,
		notice_date: value.notice_date,
		notice_type_id: value.notice_type_id,
		title: value.title,
	};
}

function RouteComponent() {
	const navigate = Route.useNavigate();
	const { notice: loadedNotice } = Route.useLoaderData();
	const { noticeId } = Route.useParams();

	// Seed from the live row, not the loader's one-shot read — see @mcmec/ui/hooks/use-form-seed.
	const { data: liveNotices } = useLiveQuery(
		(q) =>
			q
				.from({ notice: notices })
				.where(({ notice }) => eq(notice.id, noticeId)),
		[noticeId],
	);
	const notice = liveNotices[0] ?? loadedNotice;
	const { seedKey, latchProps } = useFormSeed(rowVersion(notice));

	const { data: categories } = useLiveQuery((q) =>
		q
			.from({ notice_type: noticeTypes })
			.orderBy(({ notice_type }) => notice_type.name),
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
		navigate({ params: { noticeId }, to: "/notices/$noticeId" });
	};

	return (
		<div className="space-y-4" {...latchProps}>
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
				formLabel="Edit Notice"
				key={seedKey}
				mode="edit"
				onSubmit={handleSubmit}
				submitLabel="Update"
			/>
		</div>
	);
}
