import { createFileRoute, Outlet } from "@tanstack/react-router";
import { documents, documentTypes } from "@/src/lib/db";

export const Route = createFileRoute("/(app)/document-categories")({
	component: RouteComponent,
	// Documents come along because the count of what a category holds is the reason its Delete is
	// refused, and that count has to be on screen before the button rather than in the 409 after.
	loader: async () => {
		await Promise.all([documentTypes.preload(), documents.preload()]);
		return { crumb: "Document Categories" };
	},
});

function RouteComponent() {
	return <Outlet />;
}
