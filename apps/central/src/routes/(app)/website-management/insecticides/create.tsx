import { createFileRoute } from "@tanstack/react-router";
import { CreateInsecticidePage } from "@/src/apps/website-management/insecticides/create-insecticide-page";

export const Route = createFileRoute(
	"/(app)/website-management/insecticides/create",
)({
	component: CreateInsecticidePage,
	// Preloads nothing: the form subscribes to no table.
	loader: () => ({ crumb: "Create" }),
});
