import { Badge } from "@mcmec/ui/components/badge";
import { Button } from "@mcmec/ui/components/button";
import { Mail } from "lucide-react";
import { useState } from "react";
import { API_URL } from "@/src/lib/queryClient";

// Creates the Better Auth login for an existing employee record and emails a set-password
// link (POST /api/invite, manage_employees-gated). Replaces the old Supabase edge function.
export function InviteButton({ email }: { email: string }) {
	const [loading, setLoading] = useState(false);
	// null = not sent yet. Once sent we still distinguish "email delivered" from
	// "login created but Resend failed" — the API reports that as emailSent:false.
	const [sent, setSent] = useState<{ emailSent: boolean } | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function handleInvite() {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(`${API_URL}/api/invite`, {
				body: JSON.stringify({ email }),
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				method: "POST",
			});
			// A 5xx may not carry JSON at all, so read the body defensively.
			const data = await res.json().catch(() => null);
			if (!res.ok || !data?.success) {
				setError(
					data?.error ??
						(res.status === 403
							? "You need the Employees role to send invites."
							: `Invite failed (${res.status}).`),
				);
				return;
			}
			setSent({ emailSent: data.emailSent !== false });
		} catch {
			setError("Could not reach the server.");
		} finally {
			setLoading(false);
		}
	}

	if (sent) {
		return sent.emailSent ? (
			<Badge variant="outline">Invite Sent</Badge>
		) : (
			<Badge
				title="Login created, but the email failed to send."
				variant="destructive"
			>
				Email Failed
			</Badge>
		);
	}

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
