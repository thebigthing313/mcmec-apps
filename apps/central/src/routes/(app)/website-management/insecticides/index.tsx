// validateSearch is never code-split, so it imports the component-free half.
import { validateRecordIndexSearch } from "@mcmec/ui/blocks/record-index-search";
import { createFileRoute } from "@tanstack/react-router";
import { InsecticidesPage } from "@/src/apps/website-management/insecticides/insecticides-page";

export const Route = createFileRoute("/(app)/website-management/insecticides/")(
	{
		component: InsecticidesPage,
		loader: async ({ context }) => {
			await context.insecticides.preload();
			return { crumb: "Insecticides" };
		},
		validateSearch: validateRecordIndexSearch,
	},
);
