import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/(app)/website-management/spray-missions",
)({
	// Asks for its children's tables and preloads none: this component is a bare `<Outlet />`
	// that subscribes to nothing, so each child's loader preloads what its screen reads.
	beforeLoad: ({ context }) =>
		context.websiteManagementTables.use(
			"spraySchedules",
			"insecticides",
			"municipalities",
			"sprayScheduleMunicipalities",
		),
	component: Outlet,
	loader: () => ({ crumb: "Spray Missions" }),
});
