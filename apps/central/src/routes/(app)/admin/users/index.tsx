import { createFileRoute } from "@tanstack/react-router";
import { UsersPage } from "@/src/apps/admin/users-page";

export const Route = createFileRoute("/(app)/admin/users/")({
	component: UsersPage,
	// Preloads nothing: the Employee column reads the root's `employees`, preloaded there.
	loader: () => ({ crumb: "Users" }),
});
