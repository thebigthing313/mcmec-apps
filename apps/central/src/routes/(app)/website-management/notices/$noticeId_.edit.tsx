import { createFileRoute, notFound } from "@tanstack/react-router";
import { EditNoticePage } from "@/src/apps/website-management/notices/edit-notice-page";

export const Route = createFileRoute(
	"/(app)/website-management/notices/$noticeId_/edit",
)({
	component: EditNoticePage,
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
		return { crumb: "Edit", notice };
	},
});
