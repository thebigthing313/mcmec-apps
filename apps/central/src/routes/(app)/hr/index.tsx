import { createFileRoute } from "@tanstack/react-router";
import { HrDashboard } from "@/src/apps/hr/dashboard";

export const Route = createFileRoute("/(app)/hr/")({
	component: HrDashboard,
});
