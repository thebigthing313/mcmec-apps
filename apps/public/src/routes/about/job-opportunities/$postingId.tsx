import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/about/job-opportunities/$postingId")({
	beforeLoad: ({ params }) => {
		throw redirect({
			to: "/job-opportunities/$postingId",
			params: { postingId: params.postingId },
			statusCode: 301,
		});
	},
});
