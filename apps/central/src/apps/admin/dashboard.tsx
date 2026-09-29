import { PageHeader } from "@mcmec/ui/blocks/page-header";

/** Admin's index: the placeholder the old `admin` app had at `/`, moved as is (#236). */
export function AdminDashboard() {
	return (
		<PageHeader
			description="Manage user permissions and access control."
			title="Dashboard"
		/>
	);
}
