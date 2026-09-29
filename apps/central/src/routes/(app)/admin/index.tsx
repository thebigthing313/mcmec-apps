import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/src/apps/admin/dashboard";

export const Route = createFileRoute("/(app)/admin/")({
	component: AdminDashboard,
});
