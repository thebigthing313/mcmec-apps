import { formatDate } from "@mcmec/lib/functions/date-fns";
import { PublicNoticeBadge } from "@mcmec/ui/blocks/public-notice-badge";
import { TiptapRenderer } from "@mcmec/ui/blocks/tiptap-renderer";
import { Button } from "@mcmec/ui/components/button";
import {
	createFileRoute,
	Link,
	notFound,
	useNavigate,
} from "@tanstack/react-router";
import { ArchiveX, ArrowLeft, Edit, Upload } from "lucide-react";
import { notices, noticeTypes } from "@/src/lib/db";
import { toastOnError } from "@/src/lib/toast-on-error";

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
	const { notice } = Route.useLoaderData();
	const navigate = useNavigate();
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

	const handlePublish = async () => {
		const tx = notices.update(id, (draft) => {
			draft.is_published = true;
		});
		toastOnError(tx, "Failed to publish notice.");
		await tx.isPersisted.promise;
		navigate({ to: "/notices" });
	};

	const handleUnpublish = async () => {
		const tx = notices.update(id, (draft) => {
			draft.is_published = false;
		});
		toastOnError(tx, "Failed to unpublish notice.");
		await tx.isPersisted.promise;
		navigate({ to: "/notices" });
	};

	const isDraft = !is_published;

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
					{isDraft ? (
						<Button onClick={handlePublish} size="sm" variant="default">
							<Upload />
							Publish
						</Button>
					) : (
						<Button onClick={handleUnpublish} size="sm" variant="destructive">
							<ArchiveX />
							Unpublish
						</Button>
					)}
				</div>
			</nav>

			<article className="prose">
				<div className="flex flex-row items-baseline gap-2">
					<h2>{title}</h2>
					<PublicNoticeBadge
						isArchived={is_archived}
						isPublished={is_published}
						noticeDate={notice_date}
					/>
				</div>
				<h4>Type: {type}</h4>
				<h4>Published on: {formatDate(notice_date)}</h4>
				<TiptapRenderer content={content} />
			</article>
		</div>
	);
}
