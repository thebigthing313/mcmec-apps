> **Archived research note.** Captured 2026-08-24 on branch `research/tanstack-db-semantics`
> (commit `a9c81ad`) and merged into `docs/` on 2026-09-01 to preserve it after that branch
> was pruned. It is a **historical snapshot, not current documentation**: it was verified
> against `@tanstack/db` 0.5.33 and `@tanstack/electric-db-collection` 0.2.41, and against
> `packages/collections`, which has since been renamed and absorbed into `packages/sync`.
> Both the pinned versions and that package layout have moved on — check the current
> `pnpm-lock.yaml` before relying on any version-specific claim below.

# TanStack DB mutation semantics at MCMEC's installed versions

Research for [#136](https://github.com/thebigthing313/mcmec-apps/issues/136), part of the
"writes as named domain commands" map ([#132](https://github.com/thebigthing313/mcmec-apps/issues/132)).

Five behaviours the refactor is about to lean on, documented in `F:/simmer-mosquito` against
*its* pinned versions. Each is verified below against the shipped source in this repo's
`node_modules`.

## Versions checked

| Package | This repo | Simmer (where the claims come from) |
| --- | --- | --- |
| `@tanstack/db` | **0.5.33** | 0.7.2 |
| `@tanstack/electric-db-collection` | **0.2.41** | 0.3.18 |

Read from `node_modules/@tanstack/db/package.json`,
`packages/collections/node_modules/@tanstack/electric-db-collection/package.json`, and
`pnpm-lock.yaml` (`'@tanstack/db@0.5.33'`, `'@tanstack/electric-db-collection@0.2.41'`;
root manifest pins `^0.5.33`).

The version gap is two minors on each package, so every claim below was also diffed against
simmer's copies. **The two functions the claims actually rest on —
`mergePendingMutations` and `awaitTxId`/`processMatchingStrategy` — are byte-identical
between 0.5.33/0.2.41 and 0.7.2/0.3.18.** Nothing here is version-dependent in the range
that separates the two repos.

Paths below are relative to `F:/mcmec-apps` unless stated. The `dist/esm/*.js` files are the
published build of the library's TypeScript with types stripped; they are the authority used
here.

---

## 1. `metadata` flow — CONFIRMED

**Verified against:** `node_modules/@tanstack/db/dist/esm/collection/mutations.js` lines 39, 96,
269; `node_modules/@tanstack/db/dist/esm/types.d.ts` lines 70, 282, 310, 315.

`insert(data, config)`, `update(keys, config, cb)` and `delete(keys, config)` each copy
`config.metadata` verbatim onto every `PendingMutation` they build — one mutation per key:

```js
// mutations.js:39 (insert), :96 (delete), :269 (update)
metadata: config.metadata,
```

The handler then reads it off `transaction.mutations[n].metadata`. There is no transform, no
clone, no validation — the same object reference the caller passed goes onto every mutation in
the batch.

**Types.** Asymmetric, and this is the trap:

- **Writing** (`types.d.ts:282/310/315`, the `InsertConfig`/`UpdateConfig`/`DeleteConfig`
  shapes): `metadata?: Record<string, unknown>`.
- **Reading** (`types.d.ts:70`, `PendingMutation`): `metadata: unknown` — not optional, not
  `Record`.

So a handler cannot index into `mutation.metadata` without narrowing it first. Simmer's
`readMutationMetadata` (`packages/sync/src/collections/functions/mutation-metadata.ts:10`) is
the shape that narrowing has to take, and MCMEC will need the same thing.

Note also `Transaction.metadata` (`transactions.js:94`, `this.metadata = config.metadata ?? {}`)
— a *separate*, transaction-level bag typed `Record<string, unknown>`, never merged with
per-mutation metadata. Don't confuse the two.

**For the refactor:** `metadata.intents` is a viable carrier, but the sync layer owns a
narrowing function; the type system gives it nothing at the read end.

---

## 2. The merge hazard — CONFIRMED, with a scope qualifier that matters

**Verified against:** `node_modules/@tanstack/db/dist/esm/transactions.js` lines 7–51
(`mergePendingMutations`) and 176–193 (`Transaction.applyMutations`).

The claim is exactly right about the merge rule:

```js
// transactions.js:31–42 — case `update-update`
return {
  ...incoming,
  original: existing.original,                                   // keep first original
  changes: { ...existing.changes, ...incoming.changes },          // UNION the changed fields
  metadata: incoming.metadata ?? existing.metadata,               // REPLACED WHOLE
  syncMetadata: { ...existing.syncMetadata, ...incoming.syncMetadata },
};
```

`changes` is spread-merged. `metadata` is **not** — it is nullish-coalesced, so the incoming
object replaces the existing one entirely. Two updates carrying `{ intents: ['a'] }` and
`{ intents: ['b'] }` produce one mutation with the union of both field diffs and
`intents: ['b']` alone. The server would run only the second builder over a body containing
both commands' fields. **This is precisely the silent failure simmer describes, and it is real
at 0.5.33.** The same rule applies to `insert-update` (line 20). `delete-delete`,
`insert-insert` and `update-delete` return `incoming` wholesale, which is also a whole-object
metadata replacement. `insert-delete` drops the mutation entirely (returns `null`).

One nuance the source adds that the claim does not: the coalesce is `??`, so an incoming
mutation with **no** `metadata` leaves the existing one in place. That is worse, not better —
an un-annotated write inherits the previous write's `intents` and the server executes a command
the caller never named. An `intents` design should therefore treat "metadata absent" as a hard
error at the handler (simmer's `requireIntents` throws), not as a default.

**Scope qualifier — read this before quoting the hazard.** Merging happens inside
`Transaction.applyMutations`, i.e. only between mutations that land in the *same* transaction
object. Two independent `collection.update(key, …)` calls do **not** merge: `mutations.js:294`
builds a fresh `createTransaction({...})` per direct call. The merge bites when the writes
share a transaction, which happens in three ways:

- inside `tx.mutate(() => { … })` on an explicit `createTransaction`
  (`mutations.js:49`, `:106`, `:287` route to the ambient transaction);
- inside `createOptimisticAction`, which is a thin wrapper over the same
  (`optimistic-action.js:7–16`);
- inside `createPacedMutations` (debounce/throttle), which reuses one pending transaction
  across calls (`paced-mutations.js:22–29`).

**For the refactor:** the justification for `intents` being a **list** holds. Two commands
against one row in one save must travel as one write naming both — splitting them into two
writes is unsafe wherever those writes can share a transaction, and the whole point of the
command-transaction path is that they will. Keep the list.

---

## 3. `createTransaction` bypasses handlers, and the read-only guard leaks — CONFIRMED (both parts)

**(a) Handlers are bypassed.** Verified against
`node_modules/@tanstack/db/dist/esm/collection/mutations.js` lines 49–54 (insert), 106–112
(delete), 287–293 (update), and `transactions.js:301–328` (`commit`).

When `getActiveTransaction()` returns an ambient transaction, the collection applies the
mutations to it and returns — `this.config.onInsert` is never referenced on that branch. The
`onInsert`/`onUpdate`/`onDelete` calls live only in the `else` branch, inside a per-call
`directOpTransaction`'s `mutationFn` (`mutations.js:56–63`, `:113–121`, `:294–301`).
`Transaction.commit()` awaits exactly one thing:

```js
// transactions.js:312
await this.mutationFn({ transaction: this });
```

and rolls back + rethrows if it throws (`:318–325`). Nothing else is dispatched. The
transaction's `mutationFn` is solely responsible for persisting every mutation across every
collection it touches.

**(b) The guard is `!ambientTransaction && !config.onX`.** Verified against `mutations.js:10`,
`:76`, `:201`:

```js
// mutations.js:10
const ambientTransaction = getActiveTransaction();
if (!ambientTransaction && !this.config.onInsert) {
  throw new MissingInsertHandlerError();
}
```

Identical shape for `onDelete` (`:76`, `MissingDeleteHandlerError`) and `onUpdate` (`:201`,
`MissingUpdateHandlerError`). So a collection built with no write handlers — which is what
"`mutations: false`" *is*, there being no such config flag in the library — throws on a direct
`collection.update(...)` and **silently accepts the identical write inside
`createTransaction`**. Confirmed exactly as simmer states it.

Also worth flagging: `validateCollectionUsable` runs *before* the guard
(`mutations.js:7`, `lifecycle.js:69–77`) and only restarts sync for a `cleaned-up` collection;
an `idle` one is left idle. See §5.

**For the refactor:** if MCMEC gains read-only collections and a command-transaction path, the
read-only refusal has to be re-implemented by hand on the transaction path (simmer's
`refuseIfReadOnly`). Reading it off the absence of the handler rather than a separate flag is
the right call — there is then nothing that can disagree.

---

## 4. txid confirmation — CONFIRMED, and the bundled skill doc is WRONG about the timeout

**Verified against:**
`packages/collections/node_modules/@tanstack/electric-db-collection/dist/esm/electric.js`
lines 184–233 (`awaitTxId`), 310–317 (`processMatchingStrategy`), 321–335 (the handler wrappers).

```js
// electric.js:184
const awaitTxId = async (txId, timeout = 5e3) => {
  if (typeof txId !== `number`) throw new ExpectedNumberInAwaitTxIdError(...);
  if (seenTxids.state.has(txId)) return true;                       // fast path
  if (seenSnapshots.state.some((s) => isVisibleInSnapshot(txId, s))) return true;
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      ...
      reject(new TimeoutWaitingForTxIdError(txId, config.id));      // REJECTS
    }, timeout);
    ...
  });
};
```

- **Default timeout: 5000 ms** (`timeout = 5e3`, line 184).
- **On timeout it REJECTS** with `TimeoutWaitingForTxIdError` (line 202). It does not resolve.
- It resolves early if the txid is already in `seenTxids`, or is visible in a seen snapshot.

```js
// electric.js:310
const processMatchingStrategy = async (result) => {
  if (result && `txid` in result) {
    const timeout = result.timeout;
    if (Array.isArray(result.txid)) await Promise.all(result.txid.map((t) => awaitTxId(t, timeout)));
    else await awaitTxId(result.txid, timeout);
  }
};
```

- It keys off **the presence of the `txid` property**, via `in` — not its value. Returning
  `undefined`, or an object without a `txid` key, skips the wait entirely.
- **Returning `{ txid: undefined }` is a bug, not a no-op**: the `in` check passes, then
  `typeof txId !== 'number'` throws `ExpectedNumberInAwaitTxIdError` (line 185). Any
  conditional-txid design must omit the key (or return `undefined` for the whole result), never
  set it to `undefined`.
- `result.timeout` is an optional per-return override; absent, `awaitTxId`'s 5 s default applies.
- The wrappers (`:321–335`) `await processMatchingStrategy(handlerResult)` *inside* the
  collection's `onInsert`/`onUpdate`/`onDelete`, so a rejection propagates out of the
  `mutationFn`, and `Transaction.commit` catches it, calls `this.rollback()` and rethrows
  (`transactions.js:318–325`). **A 5 s sync delay on a committed write therefore rolls the edit
  off the screen.** The doc-comment in
  `packages/collections/src/collections/electric-collection.ts:48–67` describes this correctly.

**Doc-vs-source disagreement (source wins).** The bundled skill at
`node_modules/@tanstack/db/skills/db-core/collection-setup/references/electric-adapter.md:81`
says *"`awaitTxId(txid, timeout?)` — wait for txid in Electric stream; **default timeout 30s**"*.
That is false at 0.2.41: the default is 5 s. The same file (line 118) says a mismatched txid
makes `awaitTxId` *"stall indefinitely"*; it does not — it rejects after the timeout. The
published web docs at
<https://tanstack.com/db/latest/docs/collections/electric-collection> get the 5 s right and are
vague about the rejection. Do not size a timeout budget off the bundled skill file.

### Recommendation on the txid policy

**Keep MCMEC's swallow, and add simmer's subscriber gate in front of it. They fix different
failures, and neither one covers the other.**

- The **swallow** (`settleTxids`, `electric-collection.ts:68–87`) is what stops a slow-but-live
  stream from rolling back a durably committed write. Nothing in 0.2.41 has softened
  `awaitTxId`'s rejection, so removing the swallow reintroduces exactly the data-loss-looking
  flicker the comment describes. `TXID_SETTLE_TIMEOUT_MS = 30_000` is a deliberate override of
  the 5 s default and should stay an explicit constant (note: it happens to equal the figure the
  bundled skill wrongly claims as the default — coincidence, not derivation).
- The **subscriber gate** fixes a different, currently-live problem: it stops MCMEC waiting at
  all when nothing can deliver the txid. MCMEC's eager factory passes `startSync: false`
  (`packages/collections/src/collections/create-eager-collection.ts:28`), so an eager collection
  that has never been subscribed to or preloaded sits in `idle` with **no Electric stream
  running**. A write to it today burns the full 30 s inside the mutation handler before the
  swallow lets go — the transaction stays `persisting`, `isPersisted` doesn't settle, and any
  save-button spinner sits there for half a minute. Gating on `subscriberCount > 0` skips a wait
  that provably cannot succeed. (`create-on-demand-collection.ts:39` passes `startSync: true`,
  so on-demand collections are not exposed to this — see §5.)
- Adopting **only** the gate would be the wrong trade: a warm collection (`subscriberCount > 0`)
  still gets an unswallowed rejection when sync merely lags — the flicker case. Simmer's own
  `mutation-handlers.ts:63–65` concedes this ("treat a confirmation timeout as lag rather than
  failure") but the `{ txid }` return hands the wait to `processMatchingStrategy`, which has no
  way to treat it as anything but a failure.

Concretely, for the new `packages/sync` handlers: keep returning a result with **no `txid` key**
and do the wait in-house, but wrap it as

```
if (collection.subscriberCount > 0) await settleTxids(...)   // still swallowing the timeout
```

This is a small change to `settleTxids`' caller, not a redesign, and it can land ahead of the
command refactor.

---

## 5. `subscriberCount` — PARTIALLY CONFIRMED (it exists and counts what they say; the "never resolves" claim is too strong)

**Verified against:** `node_modules/@tanstack/db/dist/esm/collection/index.js:113–117` and
`index.d.ts:148`; `collection/changes.js:9`, `:96–107`, `:111–123`;
`collection/lifecycle.js:67–80`, `:99–116`; `collection/sync.js:28–32`.

**It exists.** `get subscriberCount(): number` on `Collection`, returning
`this._changes.activeSubscribersCount`.

**What it counts.** The number of *active change subscriptions* — every live
`subscribeChanges` registration, which in practice means every mounted `useLiveQuery`/live query
compiled off the collection, plus any manual `subscribeChanges` call. It is incremented in
`changes.js:96` and decremented in `:111`; hitting zero starts the GC timer
(`lifecycle.js:67`, default `gcTime` 300 000 ms), and after it fires the collection is cleaned up
and its Electric stream aborted.

**The "paused stream never resolves" claim — split verdict.**

- **True direction:** `subscriberCount > 0` **guarantees** the stream is running.
  `changes.addSubscriber` calls `this.sync.startSync()` whenever the collection is `idle` or
  `cleaned-up` (`changes.js:99–102`). So the gate is a *sufficient* condition for "a txid can
  arrive".
- **False direction:** `subscriberCount === 0` does **not** imply a paused stream. Sync starts
  independently of subscribers via `config.startSync === true` at construction
  (`collection/index.js:102–104`), via `preload()` (`sync.js:162`), or via
  `startSyncImmediate()`. Once started it keeps running until GC — 5 minutes after the last
  subscriber leaves, by default. And `seenTxids` is populated from the raw `ShapeStream`
  subscription (`electric.js:617`, `:631`), which knows nothing about collection subscribers. A
  zero-subscriber collection whose sync is running resolves `awaitTxId` perfectly well.
- The claim is nonetheless **operationally right for the case that matters**: a collection that
  has never synced (`idle`) is not woken by a write. `validateCollectionUsable`
  (`lifecycle.js:69–77`) restarts sync for `cleaned-up` but has **no case for `idle`**, so the
  wait genuinely cannot ever be satisfied and ends in the timeout rather than resolving late.
  That is MCMEC's eager collections exactly (`startSync: false`).
- Worth recording for the on-demand factories: on-demand mode still subscribes to the full
  change feed (`electric.js:546–549`, `log: 'changes_only'`, `offset: 'now'`), so once sync has
  started, txids for *any* row in the shape arrive regardless of which subsets are loaded. The
  on-demand subset machinery narrows the initial snapshot, not the txid stream.

**For the refactor:** treat `subscriberCount` as a cheap, conservative "is anyone able to
confirm this?" test — it will occasionally skip a wait that would have succeeded, which is
harmless given the swallow, and it never waits on a collection that cannot confirm. Do not
document it as "the stream is paused"; document it as "the only state we can cheaply prove the
stream is live in".

---

## Summary table

| # | Claim | Verdict | Authority |
| --- | --- | --- | --- |
| 1 | `metadata` reaches handlers on each `PendingMutation` | CONFIRMED | `db/dist/esm/collection/mutations.js:39,96,269`; `types.d.ts:70,282` |
| 2 | Same-key merge: changes union, metadata replaced whole | CONFIRMED (scoped to one transaction; `??` means absent metadata *inherits*) | `db/dist/esm/transactions.js:7–51,176–193` |
| 3 | `createTransaction` bypasses handlers; read-only guard leaks | CONFIRMED (both parts) | `db/dist/esm/collection/mutations.js:10,76,201,49,287`; `transactions.js:312` |
| 4 | `awaitTxId` rejects on timeout, 5 s default; strategy keys off property presence | CONFIRMED; bundled skill doc's "30s" is wrong | `electric-db-collection/dist/esm/electric.js:184,202,310` |
| 5 | `subscriberCount` exists; zero means a wait that never resolves | PARTIALLY CONFIRMED — zero does not imply paused; true only for a never-synced (`idle`) collection | `db/dist/esm/collection/index.js:113`, `changes.js:96–123`, `lifecycle.js:69–80` |

## Files this touches in MCMEC

- `packages/collections/src/collections/electric-collection.ts` — `settleTxids` and the three
  handlers; the recommended `subscriberCount` gate goes here (or in its `packages/sync`
  successor).
- `packages/collections/src/collections/create-eager-collection.ts` — `startSync: false` is the
  reason the gate is worth adding.
- `packages/collections/src/collections/create-on-demand-collection.ts` — `startSync: true`;
  unaffected by the idle-collection case.
