// Transactional email via Resend (HTTP API — no SDK dependency).

type EmailArgs = { to: string; subject: string; html: string };

export async function sendEmail({
	to,
	subject,
	html,
}: EmailArgs): Promise<void> {
	const apiKey = process.env.RESEND_API_KEY;
	const from = process.env.EMAIL_FROM;
	if (!apiKey || !from) {
		throw new Error("email not configured (set RESEND_API_KEY and EMAIL_FROM)");
	}
	const res = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			authorization: `Bearer ${apiKey}`,
			"content-type": "application/json",
		},
		body: JSON.stringify({ from, to: [to], subject, html }),
	});
	if (!res.ok) {
		throw new Error(
			`resend send failed: ${res.status} ${await res.text().catch(() => "")}`,
		);
	}
}

const ESCAPE: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
};
const escapeHtml = (s: string): string =>
	s.replace(/[&<>"']/g, (ch) => ESCAPE[ch] ?? ch);

// Shared by the invite flow and the password-reset flow (same tokenized link).
export function passwordSetupHtml(name: string, url: string): string {
	return `
	<div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
		<h2>MCMEC Employee Portal</h2>
		<p>Hi ${escapeHtml(name)},</p>
		<p>Use the button below to set your password. The link expires shortly for security.</p>
		<p>
			<a href="${url}" style="display:inline-block;padding:10px 16px;background:#0f766e;color:#fff;border-radius:6px;text-decoration:none;">
				Set your password
			</a>
		</p>
		<p style="color:#666;font-size:12px;">If you didn't expect this, you can safely ignore this email.</p>
	</div>`;
}
