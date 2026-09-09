import { Mail } from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/badge";
import { Button } from "../components/button";

/**
 * Staffs an employee with a login and mails them a set-password link.
 *
 * Presentational, like `LifecycleButton` and `DangerZoneCard`: it owns the in-flight and
 * sent-once states and nothing else. `onInvite` comes in from the app, which is what keeps the
 * vocabulary out of this package — the command is `employees.inviteEmployee`, and this file has
 * no way to spell it (#165).
 *
 * It used to `fetch` `POST /api/invite` itself and read `emailSent` off the response. There is
 * no such field now: the login is created inside the command's transaction and the mail goes out
 * from an after-commit thunk, so by the time the caller has a result the account exists whether
 * or not Resend accepted the message. A failed send is a server log, and the "Email Failed"
 * badge went with the endpoint.
 */
export function InviteButton({
	onInvite,
}: {
	/** Sends the invite. Rejects with a message worth showing the user. */
	onInvite: () => Promise<void>;
}) {
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleInvite() {
		setLoading(true);
		setError(null);
		try {
			await onInvite();
			setSent(true);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Could not send the invite.");
		} finally {
			setLoading(false);
		}
	}

	// Held locally rather than read off `employee.user_id`: the row's link-up syncs back a beat
	// later, and the button must stop offering a second invite the moment the first succeeds.
	if (sent) return <Badge variant="outline">Invite Sent</Badge>;

	return (
		<div className="flex flex-col items-end gap-1">
			<Button
				disabled={loading}
				onClick={handleInvite}
				size="sm"
				variant="outline"
			>
				<Mail className="mr-1 h-3 w-3" />
				{loading ? "Sending..." : "Send Invite"}
			</Button>
			{error ? (
				<p className="text-destructive text-xs" role="alert">
					{error}
				</p>
			) : null}
		</div>
	);
}
