export interface TurnstileRenderOptions {
	sitekey: string;
	callback?: (token: string) => void;
	"error-callback"?: () => void;
	"expired-callback"?: (token: string) => void;
	theme?: "light" | "dark" | "auto";
	size?: "normal" | "flexible" | "compact";
}

export interface TurnstileObject {
	render: (
		container: string | HTMLElement,
		options: TurnstileRenderOptions,
	) => string;
	reset: (widgetId?: string) => void;
	remove: (widgetId?: string) => void;
	getResponse: (widgetId?: string) => string | undefined;
}

declare global {
	interface Window {
		turnstile: TurnstileObject;
	}
}
