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
	const widgetId = useRef<string | null>(null);
	// Store onSuccess in a ref to prevent re-renders when callback changes
	const onSuccessRef = useRef(onSuccess);
	onSuccessRef.current = onSuccess;

	useImperativeHandle(ref, () => ({
		reset: () => {
			if (widgetId.current && window.turnstile) {
				window.turnstile.reset(widgetId.current);
			}
		},
	}));

	useEffect(() => {
		let isMounted = true;
		const renderWidget = () => {
			if (
				window.turnstile &&
				containerRef.current &&
				!widgetId.current &&
				isMounted
			) {
				// Cast to 'any' to allow 'action' if your TS definitions are outdated
				widgetId.current = window.turnstile.render(containerRef.current, {
					action: "protected-form",
					//@ts-expect-error don't have definitions, need any
					callback: (token) => onSuccessRef.current(token),
					execution: "render",
					retry: "auto",
					"retry-interval": 1500,
					sitekey,
					// biome-ignore lint/suspicious/noExplicitAny: <no types for turnstile yet>
				} as any);
			}
		};

		// In production, the script might be deferred.
		// We check for it, or wait for the 'ready' state.
		if (window.turnstile) {
			renderWidget();
		} else {
			// Fallback: Check every 100ms if the script is ready
			const checkInterval = setInterval(() => {
				if (window.turnstile) {
					renderWidget();
					clearInterval(checkInterval);
				}
			}, 100);
			return () => clearInterval(checkInterval);
		}

		return () => {
			isMounted = false;
			if (widgetId.current && window.turnstile) {
				// Reset the state before removing
				window.turnstile.reset(widgetId.current);
				window.turnstile.remove(widgetId.current);
				widgetId.current = null;
			}
		};
	}, [sitekey]);

	// Adding a min-height prevents layout shift and
	// ensures the widget container is visible to the script.
	return <div className="min-h-16.25" ref={containerRef} />;
});
