import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

function RouteComponent() {
	const [countdown, setCountdown] = useState(5);
	const redirectUrl =
		"https://www.middlesexcountynj.gov/government/departments/department-of-public-safety-and-health/middlesex-county-mosquito-commission";

	useEffect(() => {
		const timer = setInterval(() => {
			setCountdown((prev) => {
				if (prev <= 1) {
					clearInterval(timer);
					window.location.href = redirectUrl;
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, []);

	return (
		<div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 to-blue-100">
			<div className="max-w-2xl space-y-6 rounded-lg bg-white p-8 text-center shadow-xl">
				<h1 className="font-bold text-4xl text-gray-800">
					Middlesex County Mosquito Extermination Commission
				</h1>
				<p className="text-gray-600 text-xl">
					Redirecting to main website in {countdown} seconds...
				</p>
				<div className="pt-4">
					<a
						href={redirectUrl}
						className="text-blue-600 underline hover:text-blue-800"
					>
						Click here if you are not redirected automatically
					</a>
				</div>
			</div>
		</div>
	);
}
