import { DangerZoneCard } from "@mcmec/ui/blocks/danger-zone-card";
import { InviteButton } from "@mcmec/ui/blocks/invite-button";
import { Badge } from "@mcmec/ui/components/badge";
import { Button } from "@mcmec/ui/components/button";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Edit } from "lucide-react";
import { intents } from "@/src/lib/intents";
import { sendInvite } from "./send-invite";

const route = getRouteApi("/(app)/hr/employees/$employeeId");

/** `/hr/employees/$employeeId`: one Employee, with Invite, Edit and Delete. */
export function EmployeePage() {
	const { employeeId } = route.useParams();
	const { employee: loadedEmployee } = route.useLoaderData();
	const { apiUrl, employees } = route.useRouteContext();
	const navigate = useNavigate();

	// Live, so an invite's `user_id` link-up and an edit made on the next screen both show here
	// rather than the values the loader captured.
	const { data: liveEmployees } = useLiveQuery(
		(q) =>
			q
				.from({ employee: employees })
				.where(({ employee }) => eq(employee.id, employeeId)),
		[employees, employeeId],
	);
	const employee = liveEmployees[0] ?? loadedEmployee;

	// Detail page only, danger zone, behind a confirm — ADR 0001's one exception to free
	// placement: the one command nothing can undo.
	const handleDelete = () => {
		const tx = employees.delete(
			employeeId,
			intents("employees.deleteEmployee"),
		);
		toastOnError(tx, "Failed to delete employee.");
		navigate({ to: "/hr/employees" });
	};

	return (
		<div className="max-w-2xl space-y-6">
			<nav className="flex items-center justify-between rounded-lg border bg-card p-4">
				<Button asChild size="sm" variant="outline">
					<Link to="/hr/employees">
						<ArrowLeft />
						Back to Employees
					</Link>
				</Button>
				<div className="flex items-center gap-2">
					{!employee.user_id && (
						<InviteButton onInvite={() => sendInvite(apiUrl, employeeId)} />
					)}
					<Button asChild size="sm" variant="outline">
						<Link params={{ employeeId }} to="/hr/employees/$employeeId/edit">
							<Edit />
							Edit
						</Link>
					</Button>
				</div>
			</nav>

			<div className="space-y-4 rounded-lg border bg-card p-6">
				<div className="flex items-center gap-3">
					<h1 className="font-semibold text-foreground text-xl leading-tight">
						{employee.display_name}
					</h1>
					{employee.user_id ? (
						<Badge variant="default">Active</Badge>
					) : (
						<Badge variant="secondary">No Account</Badge>
					)}
				</div>

				<dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
					<dt className="font-medium text-muted-foreground">Email</dt>
					<dd>{employee.email}</dd>

					<dt className="font-medium text-muted-foreground">Title</dt>
					<dd>{employee.display_title ?? "—"}</dd>

					<dt className="font-medium text-muted-foreground">Created</dt>
					<dd>{new Date(employee.created_at).toLocaleDateString()}</dd>

					<dt className="font-medium text-muted-foreground">Updated</dt>
					<dd>{new Date(employee.updated_at).toLocaleDateString()}</dd>
				</dl>
			</div>

			<DangerZoneCard
				description={
					<>
						This action cannot be undone. This will permanently delete the
						employee record for "{employee.display_name}"
						{/* Plain text, never a link: HR and Admin name each other, and whether the
						    reader holds Admin's role is not this screen's business (#238). */}
						{employee.user_id
							? ". Their login is not deleted with it. If they should lose access, revoke its App Roles in Admin."
							: "."}
					</>
				}
				label="Delete Employee"
				onConfirm={handleDelete}
			/>
		</div>
	);
}
