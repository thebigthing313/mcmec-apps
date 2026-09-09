import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "../components/button";

/** How long the check stays before the button offers itself again. */
const CONFIRM_MS = 2000;

/**
 * One value, one button, one clipboard write.
 *
 * Public Requests arrive on this screen and leave it by hand: a staff member reads the
 * resident's phone number off a detail page and re-types it into a system that has its own
 * discrete fields. Re-typing is where a digit goes missing, so every value worth re-keying
 * carries its own button — and each one copies exactly the string beside it, never a label
 * prefix, never a joined sibling, never the em-dash a reading layout added.
 *
 * **It confirms by icon swap and speaks only when it fails.** The glyph becomes a check and the
 * accessible name becomes "Copied"; no toast. The asymmetry is deliberate and is the same
 * reasoning as The Confirm Is For The Public Rule's closing line — an action the user watched
 * land on their own screen needs no ceremony. A *failed* copy is the opposite case: the user
 * now believes the clipboard holds something it does not, and the next thing they do is paste.
 * That belief has to be corrected loudly, so a rejected write raises an error toast and the
 * icon does not change.
 *
 * Absent values get a **disabled** button rather than no button, per DESIGN.md's disabled rule —
 * a staff member should be able to see that the action exists and is unavailable, instead of
 * wondering why this row is the one that cannot be copied.
 *
 * There is deliberately no `useCopyToClipboard` hook behind this. One consumer does not earn a
 * hook; if a second shape needs the write without this button, extract it then.
 */
export function CopyButton({
	className,
	disabled,
	label,
	size = "icon-sm",
	text,
	variant = "ghost",
}: {
	className?: string;
	disabled?: boolean;
	/**
	 * The noun this button copies, taken from its own visible label — "phone", "address line 1",
	 * "zip code". It becomes "Copy <label>", so no two buttons on a page announce identically.
	 */
	label: string;
	size?: React.ComponentProps<typeof Button>["size"];
	/** Exactly the string to place on the clipboard. */
	text: string;
	variant?: React.ComponentProps<typeof Button>["variant"];
}) {
	// What was copied, not merely that something was — so the check withdraws itself the moment
	// the row's value changes underneath it. These screens read from a live query, and a check
	// still standing beside a value that has since been replaced affirms a copy of the old one.
	const [copiedText, setCopiedText] = useState<string | null>(null);
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const copied = copiedText !== null && copiedText === text;

	// Nothing may set state after the row is gone — the detail page is a route, and a copy two
	// seconds before navigating away would otherwise land on an unmounted component.
	useEffect(() => () => clearTimeout(timer.current), []);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			// A second copy inside the window restarts it; left alone, the first copy's timer would
			// cut the second confirmation short.
			clearTimeout(timer.current);
			setCopiedText(text);
			timer.current = setTimeout(() => setCopiedText(null), CONFIRM_MS);
		} catch (error) {
			// A clipboard rejection has real variety behind it — no permission, an insecure
			// context, a missing user gesture — and the toast can only say the one sentence.
			console.error("Failed to copy: ", error);
			toast.error(ErrorMessages.UI.FAILED_TO_COPY);
		}
	};

	return (
		<Button
			aria-label={copied ? "Copied" : `Copy ${label}`}
			className={className}
			disabled={disabled || !text}
			onClick={handleCopy}
			size={size}
			type="button"
			variant={variant}
		>
			{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
		</Button>
	);
}
