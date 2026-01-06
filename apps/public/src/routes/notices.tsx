import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/notices")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 to-blue-100">
			<div className="max-w-2xl space-y-4 rounded-lg bg-white p-8 text-center shadow-xl">
				<h1 className="font-bold text-4xl text-gray-800">
					Middlesex County Mosquito Extermination Commission
				</h1>
				<p className="text-2xl text-gray-600">Public Notices coming soon.</p>
			</div>
		</div>
	);
}
