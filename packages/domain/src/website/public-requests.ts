/**
 * `public_requests` — the four commands of #134's vocabulary, and the only public one.
 *
 * **`submitPublicRequest` carries a `null` permission.** One command in fifty does, and this is
 * it: a request is submitted by a member of the public who holds no permission at all. What
 * stands in for one is Turnstile and a honeypot, and those guard the *route* — `POST
 * /api/requests` — not the command. So the split the null expresses is precise: the handler is
 * shared with the other three commands, the door is not. `resolveRequest` cannot inherit
 * Turnstile, and `submitPublicRequest` cannot be reached from `/api/commands`, which serves
 * only the commands that name a permission (#164).
 *
 * That is what `WRITABLE.public_requests`'s `insertable: false` was saying, and the cleanest
 * example in the cutover of a bespoke boolean becoming a vocabulary fact. The generic door had
 * to be told, per table, that one of its three verbs was off — a flag with no way to say *why*,
 * or where the insert had gone instead. The command says who may send it, and the answer for
 * this one is "anyone, through that route".
 *
 * **The payload is the public intake contract, not a row.** Every other command in the
 * vocabulary carries snake_case column names, because it is written by a collection that holds
 * rows. This one is written by a form on the public website, whose wire has always been nested
 * camelCase discriminated on `requestType` — the API validated it and `@mcmec/schemas` kept "the
 * client's copy of it", two spellings of one contract with a comment asking someone to keep them
 * in sync. The schema package's copy is now the only one, and it is the payload: the API imports
 * what the public app already validates against.
 *
 * `status` appears in no payload. A request is born `new`, and the two transitions that exist
 * are named. `in_progress` is a third enum value that no command mints — ADR 0001 dropped it from
 * the UI because `CONTEXT.md` says a request is either New or Resolved, and the button convention
 * made the drift visible where a `<Select>` had been assigning all three states equally. The
 * value stays in the `pgEnum` because existing rows may hold it; `resolveRequest` accepts one.
 *
 * #134 declined to invent transition ordering here and this slice does not promote it: the
 * server resolves or reopens a request in any state it finds it.
 */
import { PublicRequestSubmissionSchema } from "@mcmec/schemas/db/public-requests";
import z from "zod";
import { defineDomain } from "../command";

const website = defineDomain("website", "manage_website");
const command = website.table("public_requests");

/**
 * The same domain, re-opened with no permission — the one place in the vocabulary that happens.
 *
 * `website` is not two domains: a public request is website content triaged under
 * `manage_website` like everything else on it, and `submitPublicRequest` sits in the same
 * `website.` namespace as the command that resolves it. What differs is who may send it, which
 * is the one thing `defineDomain` takes.
 */
const publicWebsite = defineDomain("website", null);
const publicCommand = publicWebsite.table("public_requests");

/** The lifecycle commands take no fields — the envelope id is the whole request. */
const EmptyPayload = z.object({});

/**
 * Anonymous. Served from `POST /api/requests`, never from the dispatcher.
 *
 * The payload is `PublicRequestSubmissionSchema` verbatim — the discriminated union on
 * `requestType` that decides each type's questions. It is not spread into a `z.object` here,
 * because the union IS the validation: the per-type `details` shape is the whole point, and a
 * flattened object would accept a water-management answer on a mosquito-fish request.
 *
 * The envelope's Turnstile token and honeypot are deliberately absent. They are what the route
 * checks before it reaches this command at all, and a payload field the handler could read would
 * invite a second, weaker check inside it.
 */
export const submitPublicRequest = publicCommand(
	"submitPublicRequest",
	PublicRequestSubmissionSchema,
	{ creates: true },
);

export const resolveRequest = command("resolveRequest", EmptyPayload);
export const reopenRequest = command("reopenRequest", EmptyPayload);
export const deleteRequest = command("deleteRequest", EmptyPayload);

export const PUBLIC_REQUEST_COMMANDS = [
	submitPublicRequest,
	resolveRequest,
	reopenRequest,
	deleteRequest,
] as const;
