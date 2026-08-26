import type {
	AnyCommand,
	COMMANDS,
	CommandName,
	PayloadOf,
} from "@mcmec/domain";
import type { Tx } from "../actor";
import type { SessionInfo } from "../session";

/** Run after the transaction commits and before the response — where non-DB side effects go. */
export type AfterCommit = () => Promise<void>;

export type CommandHandler<TDef extends AnyCommand> = (ctx: {
	/** Already parsed by the command's own payload schema. */
	payload: PayloadOf<TDef>;
	/**
	 * The envelope target — the row this command is about, and `undefined` for the one command
	 * that is about no row (#163). A targetless handler therefore cannot read an id that would
	 * point at nothing.
	 */
	id: TDef extends { targetless: true } ? undefined : string;
	session: SessionInfo;
	/** The request's shared transaction. Every handler in one request writes through this. */
	tx: Tx;
}) => Promise<void | AfterCommit>;

/**
 * The registry type. Typed against the vocabulary union, so a command added to
 * `@mcmec/domain` fails this app's build until it is implemented here.
 */
export type CommandRegistry = {
	[N in CommandName]: CommandHandler<(typeof COMMANDS)[N]>;
};

/** A refusal the caller can read: `{ error, reason, message }` at a chosen status. */
export class CommandError extends Error {
	constructor(
		readonly status: 400 | 403 | 404 | 409 | 422,
		readonly body: { error: string; reason?: string; message?: string },
	) {
		super(body.message ?? body.error);
	}
}
