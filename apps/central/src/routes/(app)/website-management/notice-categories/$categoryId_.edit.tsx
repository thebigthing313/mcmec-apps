import { createFileRoute, notFound } from "@tanstack/react-router";
import { EditNoticeCategoryPage } from "@/src/apps/website-management/notice-categories/edit-notice-category-page";

export const Route = createFileRoute(
	"/(app)/website-management/notice-categories/$categoryId_/edit",
)({
	component: EditNoticeCategoryPage,
	// Preloads what the screen subscribes to; a missing id is not-found, as on every record
	// route in central.
	loader: async ({ context, params }) => {
		await context.noticeTypes.preload();
		const category = context.noticeTypes.get(params.categoryId);
		if (!category) {
			throw notFound();
		}
		return { crumb: "Edit", category };
	},
});
