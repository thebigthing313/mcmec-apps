import { createFileRoute, Outlet } from "@tanstack/react-router";
import { jobPostings } from "@/src/lib/db";

export const Route = createFileRoute("/(app)/job-postings")({
	component: RouteComponent,
	loader: async () => {
		await jobPostings.preload();
		return { crumb: "Job Postings" };
	},
});

function RouteComponent() {
	return <Outlet />;
}
