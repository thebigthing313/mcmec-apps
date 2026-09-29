import { PageHeader } from "@mcmec/ui/blocks/page-header";

/**
 * Admin's index: the placeholder the old `admin` app had at `/` (#236), its description reworded
 * from "user permissions" to the glossary's Grant and App Role.
 */
export function AdminDashboard() {
	return (
		<PageHeader
			description="Who may do what across the staff Apps: Grant and Revoke App Roles."
			title="Dashboard"
		/>
	);
}
