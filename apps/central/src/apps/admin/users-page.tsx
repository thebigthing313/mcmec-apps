import {
	APP_ROLE_LABELS,
	APP_ROLES,
	parseRoles,
} from "@mcmec/lib/constants/roles";
import { PageHeader } from "@mcmec/ui/blocks/page-header";
import { Checkbox } from "@mcmec/ui/components/checkbox";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@mcmec/ui/components/table";
import { isNull, not, useLiveQuery } from "@tanstack/react-db";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { type AppRoleChange, grantOrRevokeAppRole } from "./set-app-role";

const route = getRouteApi("/(app)/admin/users/");

type ListedUser = {
	id: string;
	email: string;
	name?: string | null;
	role?: string | null;
};

type LinkedEmployee = { name: string; title: string | null };

const USERS_KEY = ["admin", "users"] as const;

/**
 * `/admin/users`: the Grant grid. Moved from the old `admin` app's `/permissions` (#238), which
 * it replaces whole: the rows are Users, the gestures are Grant and Revoke.
 */
export function UsersPage() {
	const { apiUrl, authClient, claims, employees } = route.useRouteContext();
	const currentUserId = claims.userId;
	const queryClient = useQueryClient();

	const { data, isLoading, error } = useQuery({
		queryFn: async () => {
			const res = await authClient.admin.listUsers({
				query: { limit: 500 },
			});
			if (res.error) {
				throw new Error(res.error.message ?? "Failed to load users");
			}
			const users = (res.data?.users ?? []) as ListedUser[];
			return [...users].sort((a, b) =>
				(a.name ?? a.email).localeCompare(b.name ?? b.email),
			);
		},
		queryKey: USERS_KEY,
	});

	// The Employee column: whose login each row is. Narrowed in the query rather than given a
	// collection of its own — one shape per table (#239), and this is the shell's instance.
	const { data: linkedEmployees } = useLiveQuery(
		(q) =>
			q
				.from({ employee: employees })
				.where(({ employee }) => not(isNull(employee.user_id)))
				.select(({ employee }) => ({
					name: employee.display_name,
					title: employee.display_title,
					userId: employee.user_id,
				})),
		[employees],
	);
	const employeeByUser = new Map<string, LinkedEmployee>(
		(linkedEmployees ?? []).map((employee) => [
			employee.userId as string,
			{ name: employee.name, title: employee.title },
		]),
	);

	// One checkbox, one role, one command, named for the gesture; the server applies it to
	// whatever the row holds when it commits.
	const setRole = useMutation({
		mutationFn: (change: AppRoleChange) => grantOrRevokeAppRole(apiUrl, change),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
	});

	const users = data ?? [];

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Grant or revoke each App Role for Users with a login."
				title="Users"
			/>

			{error ? (
				<div className="rounded-md border border-destructive/50 p-4 text-destructive text-sm">
					{(error as Error).message}
				</div>
			) : null}

			{setRole.error ? (
				<div
					className="rounded-md border border-destructive/50 p-4 text-destructive text-sm"
					role="alert"
				>
					{(setRole.error as Error).message}
				</div>
			) : null}

			{isLoading ? (
				<div className="rounded-md border p-8 text-center text-muted-foreground">
					Loading users…
				</div>
			) : users.length === 0 ? (
				// Plain text, never a link: HR and Admin name each other, and whether the reader
				// holds HR's role is not this screen's business (#238).
				<div className="rounded-md border p-8 text-center text-muted-foreground">
					No Users with a login yet. Invite Employees in HR first.
				</div>
			) : (
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>User</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Employee</TableHead>
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
										<TableCell>
											<EmployeeCell employee={employeeByUser.get(user.id)} />
										</TableCell>
										{APP_ROLES.map((role) => {
											// Can't revoke your own Users role (self-lockout guard).
											const isSelfUsers =
												user.id === currentUserId && role === "manage_users";
											// Only the row being saved locks, not the whole table.
											const isSaving =
												setRole.isPending &&
												setRole.variables?.userId === user.id;
											return (
												<TableCell className="text-center" key={role}>
													<Checkbox
														aria-label={`${APP_ROLE_LABELS[role]} for ${user.email}`}
														checked={roles.includes(role)}
														disabled={isSelfUsers || isSaving}
														onCheckedChange={(checked) =>
															setRole.mutate({
																granted: checked === true,
																role,
																userId: user.id,
															})
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

/**
 * The linked Employee's display name, with the title beneath it; "—" for a User with none, which
 * is what a login whose Employee was deleted looks like. Read-only, with no link into HR (#238).
 */
function EmployeeCell({ employee }: { employee: LinkedEmployee | undefined }) {
	if (!employee) {
		return <span className="text-muted-foreground">—</span>;
	}
	return (
		<div className="flex flex-col">
			<span>{employee.name}</span>
			{employee.title ? (
				<span className="text-muted-foreground text-xs">{employee.title}</span>
			) : null}
		</div>
	);
}
