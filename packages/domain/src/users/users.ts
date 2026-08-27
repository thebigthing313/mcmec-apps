/**
 * `users` — the two commands of #134's vocabulary, and the one place a full-replace becomes a
 * gesture.
 *
 * Today the permissions grid reads a user's whole role set, computes the next set client-side
 * and PUTs the array. Two admins ticking different boxes on the same row therefore clobber each
 * other, and the audit row records a list that was rewritten rather than a role that moved.
 * `grantAppRole` / `revokeAppRole` are named for the gesture the admin actually made — one
 * checkbox, one role — and the server does the read-modify-write inside the transaction, which
 * removes the clobber as a consequence of the naming rather than as a separate fix.
 *
 * **The payload is one role, not an array.** A named command over a full-replace body would
 * rename the bug instead of fixing it, so `role` is a single value and there is no shape in
 * which a client can send a set.
 *
 * `user_id` is not in the payload either: #134 drafted it that way before the envelope existed,
 * and the envelope's `id` is what names the row a command is about.
 *
 * These do NOT close the `manage_users` self-lockout hole — an admin can still revoke their own
 * `manage_users` role, guarded only by a `disabled` prop on the client. That is #141, ruled out
 * of scope on the map.
 */
import { APP_ROLES } from "@mcmec/lib/constants/roles";
import z from "zod";
import { defineDomain } from "../command";

const users = defineDomain("users", "manage_users");
const command = users.table("users");

/**
 * The role this gesture is about.
 *
 * `APP_ROLES` is `@mcmec/lib`'s, which is now the only copy — the API took the same list off
 * this package rather than keeping its own. So the enum a payload is validated against and the
 * enum the permissions grid renders columns from cannot come apart.
 */
const RolePayload = z.object({ role: z.enum(APP_ROLES) });

export const grantAppRole = command("grantAppRole", RolePayload);
export const revokeAppRole = command("revokeAppRole", RolePayload);

export const USER_COMMANDS = [grantAppRole, revokeAppRole] as const;
