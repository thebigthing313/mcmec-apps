// validateSearch is never code-split, so it imports the component-free half.
import { validateRecordIndexSearch } from "@mcmec/ui/blocks/record-index-search";
import { createFileRoute } from "@tanstack/react-router";
import { NoticeCategoriesPage } from "@/src/apps/website-management/notice-categories/notice-categories-page";

export const Route = createFileRoute(
	"/(app)/website-management/notice-categories/",
)({
	component: NoticeCategoriesPage,
	loader: async ({ context }) => {
		await Promise.all([
			context.noticeTypes.preload(),
			context.notices.preload(),
		]);
		return { crumb: "Notice Categories" };
	},
	validateSearch: validateRecordIndexSearch,
});
