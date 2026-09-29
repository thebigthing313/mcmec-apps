import { createFileRoute } from "@tanstack/react-router";
import { CreateNoticePage } from "@/src/apps/website-management/notices/create-notice-page";

export const Route = createFileRoute(
	"/(app)/website-management/notices/create",
)({
	component: CreateNoticePage,
	loader: async ({ context }) => {
		await context.noticeTypes.preload();
		return { crumb: "Create" };
	},
});
