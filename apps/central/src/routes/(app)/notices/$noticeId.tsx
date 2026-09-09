import { PUBLIC_SITE_URL } from "@mcmec/lib/constants/apps";
import { formatDate } from "@mcmec/lib/functions/date-fns";
import { PublicNoticeBadge } from "@mcmec/ui/blocks/public-notice-badge";
import { RecordDetail } from "@mcmec/ui/blocks/record-detail";
import { TiptapRenderer } from "@mcmec/ui/blocks/tiptap-renderer";
import { Button } from "@mcmec/ui/components/button";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { notices, noticeTypes } from "@/src/lib/db";

export const Route = createFileRoute("/(app)/notices/$noticeId")({
	component: RouteComponent,
	loader: async ({ params }) => {
		await Promise.all([notices.preload(), noticeTypes.preload()]);
		const notice = notices.get(params.noticeId);
		// A draft is on this app's shape but not on the public website, so it is not here
		// either — the index's filter and this guard are the same rule, and a rule enforced
		// only by a list is a rule anyone can walk around with a URL.
		if (!notice || !notice.is_published) {
			throw notFound();
		}
		return { crumb: notice.title, notice };
	},
});

/**
 * A published notice, read as the public reads it.
 *
 * Read-only by design: publishing, archiving and editing a Notice are `manage_website`
 * commands, and Central is the application every employee has. What it adds over the public
 * website is that an employee already signed in here does not have to leave for it — and the
 * link out is there for when they want the page a resident would actually land on.
 */
function RouteComponent() {
	const { notice: loadedNotice } = Route.useLoaderData();
	const { noticeId } = Route.useParams();

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
	const { title, notice_type_id, notice_date, content, is_archived } = notice;
	const type = noticeTypes.get(notice_type_id)?.name;

	return (
		<RecordDetail
			actions={
				<Button asChild size="sm" variant="outline">
					<a
						href={`${PUBLIC_SITE_URL}/notices/${noticeId}`}
						rel="noopener noreferrer"
						target="_blank"
					>
						<ExternalLink />
						View on the public website
					</a>
				</Button>
			}
			backLink={
				<Button asChild size="sm" variant="outline">
					<Link search={true} to="/notices">
						<ArrowLeft />
						Back to Public Notices
					</Link>
				</Button>
			}
			badge={
				<PublicNoticeBadge
					isArchived={is_archived}
					isPublished={true}
					noticeDate={notice_date}
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
