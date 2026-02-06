import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export interface TurnstileWidgetRef {
	reset: () => void;
}

export const TurnstileWidget = forwardRef<
	TurnstileWidgetRef,
	{
		sitekey: string;
		onSuccess: (token: string) => void;
	}
>(function TurnstileWidget({ sitekey, onSuccess }, ref) {
	const containerRef = useRef<HTMLDivElement>(null);
	const widgetId = useRef<string | null>(null); // We store the ID here

	// Expose reset method to parent component
	useImperativeHandle(ref, () => ({
		reset: () => {
			if (widgetId.current && window.turnstile) {
				window.turnstile.reset(widgetId.current);
			}
		},
	}));

	useEffect(() => {
		// 1. Define the render function
		const renderWidget = () => {
			if (window.turnstile && containerRef.current && !widgetId.current) {
				widgetId.current = window.turnstile.render(containerRef.current, {
					callback: onSuccess,
					sitekey,
				});
			}
		};

		// 2. Render (if script is already loaded)
		if (window.turnstile) {
			renderWidget();
		}

		// 3. CLEANUP (The fix for double-rendering)
		return () => {
			if (widgetId.current && window.turnstile) {
				// This removes the iframe and cleans up Cloudflare's internal state
				window.turnstile.remove(widgetId.current);
				widgetId.current = null;
			}
		};
	}, [sitekey, onSuccess]);

	return <div ref={containerRef} />;
});
