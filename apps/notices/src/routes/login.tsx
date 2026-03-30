import { getCentralLoginUrl } from "@mcmec/lib/constants/apps";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
	beforeLoad: () => {
		throw redirect({
			href: getCentralLoginUrl(window.location.origin),
		});
	},
});
