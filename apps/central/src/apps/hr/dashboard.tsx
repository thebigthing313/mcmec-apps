import { PageHeader } from "@mcmec/ui/blocks/page-header";

/** HR's index: the placeholder the old `hr` app had at `/`, moved as is (#236). */
export function HrDashboard() {
	return (
		<PageHeader
			description="Employee records, and the invites that give Employees a login."
			title="Dashboard"
		/>
	);
}
