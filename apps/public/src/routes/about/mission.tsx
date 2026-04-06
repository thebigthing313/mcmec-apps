import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/about/mission")({
	beforeLoad: () => {
		throw redirect({ to: "/about/mission-statement", statusCode: 301 });
	},
});
