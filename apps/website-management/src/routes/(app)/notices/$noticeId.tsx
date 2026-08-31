import { formatDate } from "@mcmec/lib/functions/date-fns";
import { DangerZoneCard } from "@mcmec/ui/blocks/danger-zone-card";
import { LifecycleButton } from "@mcmec/ui/blocks/lifecycle-button";
import { PublicNoticeBadge } from "@mcmec/ui/blocks/public-notice-badge";
import { TiptapRenderer } from "@mcmec/ui/blocks/tiptap-renderer";
import { Button } from "@mcmec/ui/components/button";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { eq, useLiveQuery } from "@tanstack/react-db";
import {
	createFileRoute,
	Link,
	notFound,
	useNavigate,
} from "@tanstack/react-router";
import {
	Archive,
	ArchiveRestore,
	ArrowLeft,
	Edit,
	Undo2,
	Upload,
} from "lucide-react";
import { intents, notices, noticeTypes } from "@/src/lib/db";
import { runLifecycle } from "@/src/lib/lifecycle";

export const Route = createFileRoute("/(app)/notices/$noticeId")({
	component: RouteComponent,
	loader: async ({ params }) => {
		await Promise.all([notices.preload(), noticeTypes.preload()]);
		const notice = notices.get(params.noticeId);
		if (!notice) {
			throw notFound();
		}
		const noticeName = notice.title;
		return { crumb: noticeName, notice };
	},
});

function RouteComponent() {
	const { notice: loadedNotice } = Route.useLoaderData();
	const { noticeId } = Route.useParams();
	const navigate = useNavigate();

	// Read live rather than from the loader's one-shot read, which can land on the shape
	// snapshot before the change log applies — see @mcmec/ui/hooks/use-form-seed.
	const { data: liveNotices } = useLiveQuery(
		(q) =>
			q
				.from({ notice: notices })
				.where(({ notice }) => eq(notice.id, noticeId)),
		[noticeId],
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
	const type = noticeTypes.get(notice_type_id)?.name;

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
		navigate({ to: "/notices" });
	};

	return (
		<div className="max-w-2xl space-y-6">
			<nav className="flex items-center justify-between rounded-lg border bg-card p-4">
				<Button asChild size="sm" variant="outline">
					<Link to="/notices">
						<ArrowLeft />
						Back to Notices
					</Link>
				</Button>
				<div className="flex items-center gap-2">
					<Button asChild size="sm" variant="outline">
						<Link params={{ noticeId: id }} to="/notices/$noticeId/edit">
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
				</div>
			</nav>

			<article className="prose">
				<div className="flex flex-row items-baseline gap-2">
					<h1 className="font-semibold text-foreground text-xl leading-tight">
						{title}
					</h1>
					<PublicNoticeBadge
						isArchived={is_archived}
						isPublished={is_published}
						noticeDate={notice_date}
					/>
				</div>
				<h4>Type: {type}</h4>
				<h4>Published on: {formatDate(notice_date)}</h4>
				<TiptapRenderer className="mt-4" content={content} />
			</article>

			<DangerZoneCard
				label="Delete Notice"
				onConfirm={handleDelete}
				recordName={title}
			/>
		</div>
	);
}
