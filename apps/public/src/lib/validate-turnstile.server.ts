interface TurnstileResponse {
	success: boolean;
	"error-codes"?: string[];
	challenge_ts?: string;
	hostname?: string;
}

export async function validateTurnstile({
	token,
	remoteip,
}: {
	token: string;
	remoteip?: string;
}): Promise<TurnstileResponse> {
	const turnstileSecret = process.env.CLOUDFLARE_TURNSTILE_SECRETKEY;

	if (!turnstileSecret) {
		throw new Error("Turnstile secret key is not configured.");
	}

	const formData = new URLSearchParams();
	formData.append("secret", turnstileSecret);
	formData.append("response", token);
	if (remoteip) formData.append("remoteip", remoteip);

	try {
		const response = await fetch(
			"https://challenges.cloudflare.com/turnstile/v0/siteverify",
			{
				body: formData,
				method: "POST",
			},
		);

		const result = (await response.json()) as TurnstileResponse;
		return result;
	} catch (error) {
		console.error("Error validating Turnstile token:", error);
		return {
			"error-codes": ["network-error"],
			success: false,
		};
	}
}
