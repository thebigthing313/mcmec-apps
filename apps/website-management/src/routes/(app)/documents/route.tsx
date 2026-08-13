import { createFileRoute, Outlet } from "@tanstack/react-router";
import { documents, documentTypes } from "@/src/lib/db";

export const Route = createFileRoute("/(app)/documents")({
	component: RouteComponent,
	// Both are live-queried by the list, the detail view and the forms; a live query on a
	// collection that never synced suspends forever.
	loader: async () => {
		await Promise.all([documents.preload(), documentTypes.preload()]);
		return { crumb: "Documents" };
	},
});

function RouteComponent() {
	return <Outlet />;
}
