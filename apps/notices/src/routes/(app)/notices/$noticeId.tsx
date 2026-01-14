import { PublicNoticeCard } from "@mcmec/ui/blocks/public-notice-card";
import { Button } from "@mcmec/ui/components/button";
import {
	createFileRoute,
	Link,
	notFound,
	useNavigate,
} from "@tanstack/react-router";
import { ArchiveX, ArrowLeft, Edit, Upload } from "lucide-react";
import { notice_types } from "@/src/lib/collections/notice_types";
import { notices } from "@/src/lib/collections/notices";

export const Route = createFileRoute("/(app)/notices/$noticeId")({
	component: RouteComponent,
	loader: async ({ params }) => {
		await Promise.all([notices.preload(), notice_types.preload()]);
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
	const type = notice_types.get(notice_type_id)?.name;

	const handlePublish = async () => {
		const tx = notices.update(id, (draft) => {
			draft.is_published = true;
		});
		await tx.isPersisted.promise;
		navigate({ to: "/notices" });
	};

	const handleUnpublish = async () => {
		const tx = notices.update(id, (draft) => {
			draft.is_published = false;
		});
		await tx.isPersisted.promise;
		navigate({ to: "/notices" });
	};

	const isDraft = !is_published;

	return (
		<div className="space-y-6">
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

			<PublicNoticeCard
				content={content}
				isArchived={is_archived}
				isPublished={is_published}
				noticeDate={notice_date || new Date()}
				title={title}
				type={type || "General"}
			/>
		</div>
	);
}
