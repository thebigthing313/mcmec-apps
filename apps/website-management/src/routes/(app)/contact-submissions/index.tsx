import { Button } from "@mcmec/ui/components/button";
import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import {
	type ContactSubmission,
	ContactSubmissionsTable,
} from "@/src/components/contact-submissions-table";

export const Route = createFileRoute("/(app)/contact-submissions/")({
	component: RouteComponent,
	loader: () => {
		return { crumb: "All Submissions" };
	},
});

function RouteComponent() {
	const navigate = useNavigate();
	const { db } = Route.useRouteContext();

	const { data: submissions } = useLiveQuery((q) =>
		q
			.from({ s: db.contactFormSubmissions })
			.orderBy(({ s }) => s.created_at, "desc"),
	);

	const mappedData: ContactSubmission[] = submissions.map((s) => ({
		createdAt: s.created_at,
		email: s.email,
		id: s.id,
		isClosed: s.is_closed,
		name: s.name,
		subject: s.subject,
	}));

	return (
		<div className="flex flex-col gap-2">
			<Button
				onClick={() => navigate({ to: "/contact-submissions/create" })}
				variant="default"
			>
				<Plus />
				Create New Submission
			</Button>
			<ContactSubmissionsTable data={mappedData} />
		</div>
	);
}
