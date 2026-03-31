import { Badge } from "@mcmec/ui/components/badge";
import { Button } from "@mcmec/ui/components/button";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Edit, Mail } from "lucide-react";
import { useState } from "react";
import { employees } from "@/src/lib/db";

export const Route = createFileRoute("/(app)/employees/$employeeId")({
	component: RouteComponent,
	loader: async ({ params }) => {
		await employees.stateWhenReady();
		const employee = employees.get(params.employeeId);
		if (!employee) {
			throw notFound();
		}
		return { employee };
	},
});

function InviteButton({ email }: { email: string }) {
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);

	async function handleInvite() {
		setLoading(true);
		try {
			const res = await fetch(
				`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-employee`,
				{
					body: JSON.stringify({ email }),
					headers: {
						Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
						"Content-Type": "application/json",
					},
					method: "POST",
				},
			);
			const data = await res.json();
			if (data.success) {
				setSent(true);
			} else {
				console.error("Invite failed:", data.error);
			}
		} catch (err) {
			console.error("Invite error:", err);
		} finally {
			setLoading(false);
		}
	}

	if (sent) {
		return <Badge variant="outline">Invite Sent</Badge>;
	}

	return (
		<Button
			disabled={loading}
			onClick={handleInvite}
			size="sm"
			variant="outline"
		>
			<Mail className="mr-1 h-3 w-3" />
			{loading ? "Sending..." : "Send Invite"}
		</Button>
	);
}

function RouteComponent() {
	const { employee } = Route.useLoaderData();
	const { employeeId } = Route.useParams();

	return (
		<div className="max-w-2xl space-y-6">
			<nav className="flex items-center justify-between rounded-lg border bg-card p-4">
				<Button asChild size="sm" variant="outline">
					<Link to="/employees">
						<ArrowLeft />
						Back to Employees
					</Link>
				</Button>
				<div className="flex items-center gap-2">
					{!employee.user_id && <InviteButton email={employee.email} />}
					<Button asChild size="sm" variant="outline">
						<Link params={{ employeeId }} to="/employees/$employeeId/edit">
							<Edit />
							Edit
						</Link>
					</Button>
				</div>
			</nav>

			<div className="space-y-4 rounded-lg border bg-card p-6">
				<div className="flex items-center gap-3">
					<h2 className="font-bold text-2xl">{employee.display_name}</h2>
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
		</div>
	);
}
