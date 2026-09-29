// validateSearch is never code-split, so its validator lives outside src/apps/.

import { createFileRoute } from "@tanstack/react-router";
import { NoticesPage } from "@/src/apps/website-management/notices/notices-page";
import { validateNoticesSearch } from "@/src/lib/website-management-search";

export const Route = createFileRoute("/(app)/website-management/notices/")({
	component: NoticesPage,
	loader: async ({ context }) => {
		await Promise.all([
			context.notices.preload(),
			context.noticeTypes.preload(),
		]);
		return { crumb: "Public Notices" };
	},
	validateSearch: validateNoticesSearch,
});
