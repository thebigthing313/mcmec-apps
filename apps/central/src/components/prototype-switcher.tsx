/**
 * PROTOTYPE — throwaway (#299). The floating variant switcher. Dev builds only.
 */
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";

export function PrototypeSwitcher({
	current,
	onChange,
	variants,
}: {
	current: string;
	onChange: (key: string) => void;
	variants: Array<{ key: string; name: string }>;
}) {
	const index = Math.max(
		0,
		variants.findIndex((v) => v.key === current),
	);
	const go = (delta: number) =>
		onChange(
			variants[(index + delta + variants.length) % variants.length]?.key ??
				current,
		);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const t = e.target as HTMLElement | null;
			if (
				t?.closest(
					"input, textarea, select, [contenteditable=true], [role=dialog]",
				)
			)
				return;
			if (e.key === "ArrowLeft") go(-1);
			if (e.key === "ArrowRight") go(1);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	});

	if (!import.meta.env.DEV) return null;
	const v = variants[index] ?? { key: current, name: "" };
	return (
		<div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-neutral-900 px-2 py-1.5 text-sm text-white shadow-xl">
			<button
				aria-label="Previous variant"
				className="rounded-full p-1 hover:bg-white/20"
				onClick={() => go(-1)}
				type="button"
			>
				<ChevronLeft className="size-4" />
			</button>
			<span className="min-w-48 text-center">
				<span className="font-mono font-semibold">{v.key}</span> — {v.name}
			</span>
			<button
				aria-label="Next variant"
				className="rounded-full p-1 hover:bg-white/20"
				onClick={() => go(1)}
				type="button"
			>
				<ChevronRight className="size-4" />
			</button>
		</div>
	);
}
