import { PageHeader } from "@mcmec/ui/blocks/page-header";

/** HR's index: the placeholder the old `hr` app had at `/`, moved as is (#236). */
export function HrDashboard() {
	return (
		<PageHeader
			description="Employee records and their access to the staff applications."
			title="Dashboard"
		/>
	);
}
