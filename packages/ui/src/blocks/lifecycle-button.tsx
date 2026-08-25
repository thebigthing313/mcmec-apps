import { Button } from "../components/button";

/**
 * Prefixed onto a lifecycle label when the form beneath it has unsaved changes.
 *
 * Exported because the sentence a refusal has to carry is the mirror of this one: if the button
 * said "Save and Publish" and the publish was refused, the field save rolled back with it and
 * the toast must say so. See `savedTogether` at the call site.
 */
export const SAVE_AND_PREFIX = "Save and ";

/** The label a lifecycle button shows, given whether the form beneath it is dirty. */
export function lifecycleLabel(label: string, isDirty: boolean): string {
	return isDirty ? `${SAVE_AND_PREFIX}${label}` : label;
}

/**
 * A lifecycle action. Never a switch, never a checkbox — ADR 0001.
 *
 * A switch reads as a field the user sets and then saves, which is exactly the conflation named
 * commands exist to remove: `is_published` appears in no `update*Details` payload schema, so
 * publishing is not something you can save your way into. A button that fires its own command
 * is what makes that visible on the screen.
 *
 * **Relabels on a dirty form.** "Publish" becomes "Save and Publish", and the caller then sends
 * ONE request carrying both intents — `["website.updateNoticeDetails", "website.publishNotice"]`
 * — which the dispatcher runs in a single transaction. It is atomic, so a refused lifecycle
 * command rolls the field save back with it; the user's typing survives in the form, but the
 * refusal copy has to say the changes were not saved either.
 *
 * The button does not read the form. `isDirty` comes in and `onAct` goes out carrying it, so
 * the caller — which owns both the form values and the collection — composes the intents. That
 * is what keeps `@mcmec/ui` from having to know the vocabulary.
 */
export function LifecycleButton({
	className,
	disabled,
	icon,
	isDirty = false,
	label,
	onAct,
	size,
	variant = "outline",
}: {
	className?: string;
	disabled?: boolean;
	icon?: React.ReactNode;
	/** True when the form beneath has unsaved changes. Omit on a read-only detail view. */
	isDirty?: boolean;
	/** The action's own name — "Publish", "Archive", "Close", "Reschedule". */
	label: string;
	/**
	 * `withSave` is `isDirty`, handed back so the caller sends the field save in the same
	 * request rather than re-deriving it.
	 */
	onAct: (withSave: boolean) => void;
	size?: React.ComponentProps<typeof Button>["size"];
	variant?: React.ComponentProps<typeof Button>["variant"];
}) {
	return (
		<Button
			className={className}
			disabled={disabled}
			onClick={() => onAct(isDirty)}
			size={size}
			type="button"
			variant={variant}
		>
			{icon}
			{lifecycleLabel(label, isDirty)}
		</Button>
	);
}
