import { createFileRoute, notFound } from "@tanstack/react-router";
import { NoticeCategoryPage } from "@/src/apps/website-management/notice-categories/notice-category-page";

export const Route = createFileRoute(
	"/(app)/website-management/notice-categories/$categoryId",
)({
	component: NoticeCategoryPage,
	// Preloads what the screen subscribes to; a missing id is not-found, as on every record
	// route in central.
	loader: async ({ context, params }) => {
		await Promise.all([
			context.noticeTypes.preload(),
			context.notices.preload(),
		]);
		const category = context.noticeTypes.get(params.categoryId);
		if (!category) {
			throw notFound();
		}
		return { crumb: category.name, category };
	},
});
