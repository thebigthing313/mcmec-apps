import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/about/how-we-control-mosquitoes")({
	beforeLoad: () => {
		throw redirect({
			to: "/mosquito-control/how-we-control-mosquitoes",
			statusCode: 301,
		});
	},
});
