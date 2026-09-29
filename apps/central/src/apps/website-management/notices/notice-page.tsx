import { formatDate } from "@mcmec/lib/functions/date-fns";
import { DangerZoneCard } from "@mcmec/ui/blocks/danger-zone-card";
import { LifecycleButton } from "@mcmec/ui/blocks/lifecycle-button";
import { PublicNoticeBadge } from "@mcmec/ui/blocks/public-notice-badge";
import { RecordDetail } from "@mcmec/ui/blocks/record-detail";
import { TiptapRenderer } from "@mcmec/ui/blocks/tiptap-renderer";
import { Button } from "@mcmec/ui/components/button";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import {
	Archive,
	ArchiveRestore,
	ArrowLeft,
	Edit,
	Undo2,
	Upload,
} from "lucide-react";
import { runLifecycle } from "@/src/apps/website-management/lib/lifecycle";
import { intents } from "@/src/lib/intents";

const route = getRouteApi("/(app)/website-management/notices/$noticeId");

export function NoticePage() {
	const { notices, noticeTypes } = route.useRouteContext();
	const { notice: loadedNotice } = route.useLoaderData();
	const { noticeId } = route.useParams();
	const navigate = useNavigate();

	// Read live rather than from the loader's one-shot read, which can land on the shape
	// snapshot before the change log applies — see @mcmec/ui/hooks/use-form-seed.
	const { data: liveNotices } = useLiveQuery(
		(q) =>
			q
				.from({ notice: notices })
				.where(({ notice }) => eq(notice.id, noticeId)),
		[notices, noticeId],
	);
	const notice = liveNotices[0] ?? loadedNotice;
	const {
		id,
		title,
		notice_type_id,
		notice_date,
		content,
		is_published,
		is_archived,
	} = notice;
	// A subscription, not a one-shot `noticeTypes.get()`: the loader preloads `noticeTypes`, and a
	// preloaded collection nobody subscribes to never starts its GC clock, so it would sync for
	// the rest of the session (src/lib/collections/registry.ts).
	const { data: liveTypes } = useLiveQuery(
		(q) =>
			q
				.from({ notice_type: noticeTypes })
				.where(({ notice_type }) => eq(notice_type.id, notice_type_id)),
		[noticeTypes, notice_type_id],
	);
	const type = liveTypes[0]?.name;

	// No form under these, so no `isDirty` and no relabel: a detail-view lifecycle button
	// always sends exactly one intent. The page stays put afterwards — the badge below is
	// live, so the result of the click is visible where the click was.
	const publish = is_published
		? {
				icon: <Undo2 />,
				label: "Unpublish",
				onAct: () =>
					runLifecycle(notices, id, {
						apply: (draft) => {
							draft.is_published = false;
						},
						command: "website.unpublishNotice",
						failure: "Failed to unpublish notice.",
					}),
			}
		: {
				icon: <Upload />,
				label: "Publish",
				onAct: () =>
					runLifecycle(notices, id, {
						apply: (draft) => {
							draft.is_published = true;
						},
						command: "website.publishNotice",
						failure: "Failed to publish notice.",
					}),
			};

	// P.L. 2025 c.72 lives in the handler, so Archive is offered unconditionally and a refusal
	// comes back as a 409 whose message is written for the person who clicked.
	const archive = is_archived
		? {
				icon: <ArchiveRestore />,
				label: "Unarchive",
				onAct: () =>
					runLifecycle(notices, id, {
						apply: (draft) => {
							draft.is_archived = false;
						},
						command: "website.unarchiveNotice",
						failure: "Failed to unarchive notice.",
					}),
			}
		: {
				icon: <Archive />,
				label: "Archive",
				onAct: () =>
					runLifecycle(notices, id, {
						apply: (draft) => {
							draft.is_archived = true;
						},
						command: "website.archiveNotice",
						failure: "Failed to archive notice.",
					}),
			};

	// Delete is the one action whose placement is not free — detail page only, danger zone,
	// behind a confirm (ADR 0001). It leaves the page because the record it was showing is gone.
	const handleDelete = () => {
		const tx = notices.delete(id, intents("website.deleteNotice"));
		toastOnError(tx, "Failed to delete notice.");
		navigate({ to: "/website-management/notices" });
	};

	return (
		<RecordDetail
			actions={
				<>
					<Button asChild size="sm" variant="outline">
						<Link
							params={{ noticeId: id }}
							to="/website-management/notices/$noticeId/edit"
						>
							<Edit />
							Edit
						</Link>
					</Button>
					{[publish, archive].map(({ icon, label, onAct }) => (
						<LifecycleButton
							icon={icon}
							key={label}
							label={label}
							onAct={onAct}
							size="sm"
						/>
					))}
				</>
			}
			backLink={
				<Button asChild size="sm" variant="outline">
					<Link search={true} to="/website-management/notices">
						<ArrowLeft />
						Back to Notices
					</Link>
				</Button>
			}
			badge={
				<PublicNoticeBadge
					isArchived={is_archived}
					isPublished={is_published}
					noticeDate={notice_date}
				/>
			}
			danger={
				<DangerZoneCard
					label="Delete Notice"
					onConfirm={handleDelete}
					recordName={title}
				/>
			}
			fields={[
				{ label: "Type", value: type },
				{ label: "Notice date", value: formatDate(notice_date) },
			]}
			title={title}
		>
			<TiptapRenderer className="prose" content={content} />
		</RecordDetail>
	);
}
