---
version: 1
slug: "apps-website-management-src-routes-app-index-tsx"
primary_target: "apps/website-management/src/routes/(app)/index.tsx"
related_targets: ["packages/ui/src/blocks/signal-band.tsx","apps/website-management/src/components/signal-queue.tsx"]
---

# Website Management dashboard

**Scope.** The signed-in landing screen of `apps/website-management` — the route at `(app)/index.tsx`
and the `SignalBand` block it drives. Not the eight authoring screens it points into.

**Visitor mode.** Operate.

**Audience and job.** Commission staff with `manage_website`, on an office desktop, arriving at the
start of a working session. Their question is "what needs me today?", and their second question,
answered only after the first, is "is the public site currently correct?".

**Action.** Open the one queue that matters and act on a record in it. Every count on the screen is
the size of a queue that opens in place; nothing on this screen is a statistic you can only read.

**Content.** Five signals, ordered left to right by consequence: Spray Missions tonight, Public
Requests aging past five days, new Public Requests awaiting triage, Notices not yet public, and
upcoming Meetings. Beneath them, the public's published surface — Notices on the board, Documents
published, Insecticides listed, Job Postings open.

**Constraints.**

- Colour may not rank these. DESIGN.md reserves Commission Green for the active state and Refusal
  Red for destruction, so urgency is carried by left-to-right ordering, by each signal's condition
  phrase, and by which signal the screen opens on. Anyone adding a signal inherits that constraint.
- The two registers may not restate each other. The register below exists to *confirm* the public
  record, so a fact already visible in the band does not belong in it — that was the finish
  reviewer's finding on the first cut, when three of four register facts reprinted band cells.
- Every collection live-queried here must be preloaded in the loader. A live query against a
  collection that never started syncing suspends forever, and there is no Suspense boundary above
  this route.
- `publicRequests` is an on-demand collection and syncs after the eager ones, so anything deriving
  a default from "which signal has work" must wait for `useLiveQuery`'s `isReady`, never a timer
  and never the first non-zero tick.

**Chosen direction.** "The Signal Strip" (concept seed `e92950ed`, surface scope, code-led). One
instrument: a ruled band of signal cells sharing a single border with the queue that opens beneath
it. Rejected on the same roll: an Obligations Board (one ranked cross-domain table) and a Day Sheet
(Today / This Week / Beyond columns).

**Memorable moment.** The band is a real tablist, so a staff member can arrow across the five
signals and watch each queue settle in under the same header in 200ms — the whole triage sweep
without a page load or a pointer.

**Unresolved.**

- The queue row vocabulary lives in `apps/website-management/src/components/signal-queue.tsx`. If a
  second staff app grows a queue, it should move to `packages/ui` rather than being copied.
- `AGING_DAYS` is fixed at 5 and was chosen by reasoning about when a resident assumes nobody read
  their complaint, not from evidence. Worth confirming against how the office actually works.
- The band has no loading state of its own because the loader preloads everything it reads. That
  holds only while every signal is backed by a preloaded collection.
