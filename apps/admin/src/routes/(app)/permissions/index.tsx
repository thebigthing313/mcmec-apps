import type { Claims } from "@mcmec/auth/types";
import {
	APP_ROLE_LABELS,
	APP_ROLES,
	type AppRole,
	parseRoles,
} from "@mcmec/lib/constants/roles";
import { Checkbox } from "@mcmec/ui/components/checkbox";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@mcmec/ui/components/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { API_URL, authClient } from "@/src/lib/queryClient";

export const Route = createFileRoute("/(app)/permissions/")({
	component: PermissionsPage,
});

type AdminUser = {
	id: string;
	email: string;
	name?: string | null;
	role?: string | null;
};

const USERS_KEY = ["admin", "users"] as const;

function PermissionsPage() {
	const { claims } = Route.useRouteContext();
	const { userId: currentUserId } = claims as Claims;
	const queryClient = useQueryClient();

	const { data, isLoading, error } = useQuery({
		queryKey: USERS_KEY,
		queryFn: async () => {
			const res = await authClient.admin.listUsers({
				query: { limit: 500 },
			});
			if (res.error) {
				throw new Error(res.error.message ?? "Failed to load users");
			}
			const users = (res.data?.users ?? []) as AdminUser[];
			return [...users].sort((a, b) =>
				(a.name ?? a.email).localeCompare(b.name ?? b.email),
			);
		},
	});

	// Full-replace the user's role set via the audited backend endpoint, then refetch.
	const setRoles = useMutation({
		mutationFn: async (vars: { userId: string; roles: AppRole[] }) => {
			const res = await fetch(`${API_URL}/api/users/${vars.userId}/roles`, {
				body: JSON.stringify({ roles: vars.roles }),
				credentials: "include",
				headers: { "content-type": "application/json" },
				method: "PUT",
			});
			if (!res.ok) {
				throw new Error(`Failed to update roles (${res.status})`);
			}
			return res.json();
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
	});

	function toggle(user: AdminUser, roleKey: AppRole, checked: boolean) {
		const current = parseRoles(user.role);
		const next = checked
			? [...new Set([...current, roleKey])]
			: current.filter((r) => r !== roleKey);
		setRoles.mutate({ roles: next, userId: user.id });
	}

	const users = data ?? [];

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="font-bold text-2xl">Manage Permissions</h1>
				<p className="text-muted-foreground">
					Grant or revoke each app's role for users with accounts.
				</p>
			</div>

			{error ? (
				<div className="rounded-md border border-destructive/50 p-4 text-destructive text-sm">
					{(error as Error).message}
				</div>
			) : null}

			{setRoles.error ? (
				<div
					className="rounded-md border border-destructive/50 p-4 text-destructive text-sm"
					role="alert"
				>
					{(setRoles.error as Error).message}
				</div>
			) : null}

			{isLoading ? (
				<div className="rounded-md border p-8 text-center text-muted-foreground">
					Loading users…
				</div>
			) : users.length === 0 ? (
				<div className="rounded-md border p-8 text-center text-muted-foreground">
					No users with accounts yet. Invite employees from the HR app first.
				</div>
			) : (
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>User</TableHead>
								<TableHead>Email</TableHead>
								{APP_ROLES.map((role) => (
									<TableHead className="text-center" key={role}>
										{APP_ROLE_LABELS[role]}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{users.map((user) => {
								const roles = parseRoles(user.role);
								return (
									<TableRow key={user.id}>
										<TableCell className="font-medium">
											{user.name ?? "—"}
										</TableCell>
										<TableCell>{user.email}</TableCell>
										{APP_ROLES.map((role) => {
											// Can't revoke your own Users role (self-lockout guard).
											const isSelfUsers =
												user.id === currentUserId && role === "manage_users";
											// Only the row being saved locks, not the whole table.
											const isSaving =
												setRoles.isPending &&
												setRoles.variables?.userId === user.id;
											return (
												<TableCell className="text-center" key={role}>
													<Checkbox
														aria-label={`${APP_ROLE_LABELS[role]} for ${user.email}`}
														checked={roles.includes(role)}
														disabled={isSelfUsers || isSaving}
														onCheckedChange={(checked) =>
															toggle(user, role, checked === true)
														}
													/>
												</TableCell>
											);
										})}
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
}
