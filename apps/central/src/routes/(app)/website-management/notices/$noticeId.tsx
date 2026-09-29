import { createFileRoute, notFound } from "@tanstack/react-router";
import { NoticePage } from "@/src/apps/website-management/notices/notice-page";

export const Route = createFileRoute(
	"/(app)/website-management/notices/$noticeId",
)({
	component: NoticePage,
	// Preloads what the screen subscribes to; a missing id is not-found, as on every record
	// route in central.
	loader: async ({ context, params }) => {
		await Promise.all([
			context.notices.preload(),
			context.noticeTypes.preload(),
		]);
		const notice = context.notices.get(params.noticeId);
		if (!notice) {
			throw notFound();
		}
		return { crumb: notice.title, notice };
	},
});
