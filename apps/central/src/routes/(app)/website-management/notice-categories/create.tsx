import { createFileRoute } from "@tanstack/react-router";
import { CreateNoticeCategoryPage } from "@/src/apps/website-management/notice-categories/create-notice-category-page";

export const Route = createFileRoute(
	"/(app)/website-management/notice-categories/create",
)({
	component: CreateNoticeCategoryPage,
	// Preloads nothing: the form subscribes to no table.
	loader: () => ({ crumb: "Create" }),
});
