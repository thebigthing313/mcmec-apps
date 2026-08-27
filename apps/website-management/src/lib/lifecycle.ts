import type { CommandName } from "@mcmec/domain";
import { toastOnError } from "@mcmec/ui/lib/toast-on-error";
import type { OperationConfig, WritableDeep } from "@tanstack/react-db";
import { intents, withArguments } from "./db";

/**
 * Save-and-X, in one place.
 *
 * ADR 0001 makes a lifecycle button on a dirty form relabel and send ONE request carrying both
 * intents. `dispatch.ts` runs them in a single transaction, so the two either land together or
 * roll back together — which is the whole reason this is one `.update()` and not two.
 *
 * The route composes it, not `@mcmec/ui`: `LifecycleButton` hands `isDirty` back through
 * `onAct` and stops there, so the vocabulary stays out of the component library (#158).
 */

/**
 * The one `update` overload this helper uses, spelled structurally so any collection fits.
 *
 * `TDraft` lands on the collection's INPUT row type, which is what the updater is handed.
 */
type UpdatableCollection<TDraft> = {
	update(
		id: string,
		config: OperationConfig,
		callback: (draft: WritableDeep<TDraft>) => void,
	): { isPersisted: { promise: Promise<unknown> } };
};

/**
 * The draft a collection hands its updater — what `apply` is written against.
 *
 * Not the row you read out of the collection: that carries TanStack DB's four `$`-prefixed
 * virtual properties and the draft does not.
 */
export type Draft<TCollection> =
	TCollection extends UpdatableCollection<infer TDraft>
		? WritableDeep<TDraft>
		: never;

export interface LifecycleAction<TDraft> {
	/** The lifecycle command itself — `website.publishNotice`. */
	command: CommandName;
	/** The optimistic edit that matches it. The intent says what it meant; this says what shows. */
	apply: (draft: WritableDeep<TDraft>) => void;
	/** Fallback toast copy. A refusal's own sentence wins over it whenever there is one. */
	failure: string;
	/**
	 * The field save to carry along, when the form beneath has real changes. Omit on a clean
	 * form or a read-only detail view — and note "real": pass the output of `changedFields`,
	 * never a sticky `isDirty`, or a typed-then-reverted form sends `update*Details` an empty
	 * payload and earns a 400 from its own non-empty refinement.
	 */
	save?: {
		command: CommandName;
		changes: Record<string, unknown>;
		/**
		 * Non-column values the saved command needs — `municipality_ids` on a spray mission.
		 * A save carrying only these is still a real save, so it counts towards "dirty".
		 */
		arguments?: Record<string, unknown>;
	};
}

export function runLifecycle<TDraft extends object>(
	collection: UpdatableCollection<TDraft>,
	id: string,
	{ command, apply, failure, save }: LifecycleAction<TDraft>,
) {
	const changes = save?.changes;
	const savedTogether =
		!!save &&
		((!!changes && Object.keys(changes).length > 0) || !!save.arguments);

	const tx = collection.update(
		id,
		withArguments(
			intents(...(savedTogether && save ? [save.command, command] : [command])),
			savedTogether ? save?.arguments : undefined,
		),
		(draft) => {
			if (changes) Object.assign(draft, changes);
			apply(draft);
		},
	);
	toastOnError(tx, failure, { savedTogether });
	return tx;
}

/**
 * The fields of a form that actually differ from the row it was seeded from.
 *
 * This drives both the relabel and the payload, so they cannot disagree. TanStack Form's own
 * `isDirty` is sticky — it stays true after the user reverts an edit — and a "Save and Publish"
 * built on that sends `update*Details` nothing to update.
 *
 * Dates compare by instant and rich-text documents by serialisation, because both arrive as
 * fresh objects on every render and would otherwise always look changed.
 */
export function changedFields(
	values: object,
	row: object,
): Record<string, unknown> {
	const current = row as Record<string, unknown>;
	const changed: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(values)) {
		if (!sameValue(value, current[key])) changed[key] = value;
	}
	return changed;
}

function sameValue(a: unknown, b: unknown): boolean {
	if (Object.is(a, b)) return true;
	if (a instanceof Date || b instanceof Date) {
		const left = a == null ? NaN : new Date(a as string | Date).getTime();
		const right = b == null ? NaN : new Date(b as string | Date).getTime();
		return left === right;
	}
	if (typeof a === "object" && typeof b === "object" && a && b) {
		return JSON.stringify(a) === JSON.stringify(b);
	}
	return false;
}
