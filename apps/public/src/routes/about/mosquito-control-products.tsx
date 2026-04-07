import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/about/mosquito-control-products")({
	beforeLoad: () => {
		throw redirect({
			to: "/mosquito-control/mosquito-control-products",
			statusCode: 301,
		});
	},
});
