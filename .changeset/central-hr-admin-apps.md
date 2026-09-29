---
"central": minor
"@mcmec/lib": minor
"@mcmec/ui": patch
---

HR and Admin move into central. HR (`/hr`, gated by `manage_employees`) holds the one Employees area: `/hr/employees`, `/hr/employees/$employeeId` and `/hr/employees/$employeeId/edit`, where whoever enters HR can view, add, edit, invite and delete. Admin (`/admin`, gated by `manage_users`) holds only the Grant grid, now `/admin/users` and titled "Users", which gains a read-only Employee column showing the linked Employee's display name and title, or "—" for a User with none. The nav reads "Employees" and "Users", and HR and Admin name each other in plain text rather than linking. Both Apps read the root's `employees`, so entering them loads no extra shape.

`@mcmec/lib`: the App list's HR and Admin entries are now the paths `/hr` and `/admin`, so central's switcher links to them with the router. From the retiring `hr` and `admin` apps, those entries now open central's `/hr` and `/admin`.

`@mcmec/ui`: the Employees index is titled "Employees" instead of "Manage Employees".
