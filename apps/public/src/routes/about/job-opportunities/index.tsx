import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/about/job-opportunities/")({
	beforeLoad: () => {
		throw redirect({ to: "/job-opportunities", statusCode: 301 });
	},
});
