import {
	formatDate,
	formatDateShort,
	formatTime,
} from "@mcmec/lib/functions/date-fns";
import { PublicNoticeBadge } from "@mcmec/ui/blocks/public-notice-badge";
import { TiptapRenderer } from "@mcmec/ui/blocks/tiptap-renderer";
import { Button } from "@mcmec/ui/components/button";
import { Label } from "@mcmec/ui/components/label";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { notice_types } from "@/src/lib/collections/notice_types";
import { notices } from "@/src/lib/collections/notices";
export const Route = createFileRoute("/notices/$noticeId")({
	component: RouteComponent,
	loader: async ({ params }) => {
		await Promise.all([notices.preload(), notice_types.preload()]);
		const notice = notices.get(params.noticeId);
		if (!notice) {
			throw notFound();
		}
		return { notice };
	},
});

function RouteComponent() {
	const { notice } = Route.useLoaderData();
	const {
		id,
		title,
		notice_type_id,
		notice_date,
		content,
		is_published,
		is_archived,
		updated_at,
	} = notice;

	const type = notice_types.get(notice_type_id)?.name;

	return (
		<>
			<Button asChild variant="link">
				<Link to={`/notices`}>
					<ChevronLeft />
					Return to Current Notices
				</Link>
			</Button>

			<article className="prose">
				<h2>{title}</h2>
				<div className="flex flex-row items-center gap-2">
					<Label>Status: </Label>
					<PublicNoticeBadge
						isArchived={is_archived}
						isPublished={is_published}
						noticeDate={notice_date}
					/>
				</div>

				<h3>Notice Date: {formatDate(notice_date)}</h3>
				<TiptapRenderer content={content} />
			</article>
			<div className="flex flex-col text-muted text-sm italic">
				<p>Notice Type: {type}</p>
				<p>Notice ID: {id}</p>
				<p>
					Last updated: {formatDateShort(updated_at)} {formatTime(updated_at)}
				</p>
			</div>
		</>
	);
}
