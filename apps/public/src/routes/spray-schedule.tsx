import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/spray-schedule")({
	beforeLoad: () => {
		throw redirect({
			to: "/mosquito-control/spray-schedule",
			statusCode: 301,
		});
	},
});
