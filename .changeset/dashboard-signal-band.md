---
"@mcmec/ui": minor
"website-management": minor
---

Make the Website Management dashboard a place to start work, not a place to read numbers

The dashboard opened on four stat cards over a 2×2 grid of list cards. Every count was a dead end —
the number told you there were twelve open Public Requests and then made you leave the page to see
one — and nothing on the screen said which of the four mattered first. It also lied: the "Upcoming
Meetings" card sorted `meeting_at` descending, so it showed the most recent *past* meetings under a
heading promising the opposite.

**One instrument.** A new `SignalBand` block puts five named signals across the top of the screen —
Spray Missions tonight, Public Requests aging past five days, new Requests awaiting triage, Notices
not yet public, upcoming Meetings — and opens each one's queue directly beneath it, inside the same
border. The count is the size of a queue you are one keypress from reading. The screen opens on the
most consequential signal that actually holds work, so someone signing in during a spray week lands
on tonight's mission and someone signing in in February lands on whatever is genuinely outstanding.

**Ranking without colour.** DESIGN.md reserves Commission Green for the active state and Refusal Red
for destruction, so neither is available to mark urgency. Rank is carried by the cells'
left-to-right order, by each signal's condition phrase — "open 5+ days", "awaiting triage", "none
scheduled" — and by which signal the screen opens on. A zero count recedes to Muted Ink so the eye
lands on the signals holding real work. This is the Status Is A Word Rule applied to a control
rather than to a badge, and it is recorded in DESIGN.md as **The Count Opens Its Queue Rule**.

**One row for four domains.** Every queue renders through one row vocabulary — what the record is,
where or who, when in tabular figures, and its state as a word — so switching signals changes the
content and nothing about where to look. Left to themselves, five queues across four domains grow
five arrangements on one surface.

**Keyboard, because staff live here.** The band is a real WAI-ARIA tablist: Left/Right/Home/End move
the selection and open the queue as they go, in 200ms, which is the screen's only authored motion.
ArrowUp/ArrowDown are deliberately absent and `aria-orientation="horizontal"` is declared — below
`lg` the band wraps to a two-dimensional grid where a vertical arrow would move the selection
sideways.

**The lower half confirms rather than repeats.** "What the public sees right now" reports the
published surface a resident actually loads — Notices on the board with the newest posting's date,
Documents published, Insecticides listed, Job Postings open. None of it restates a signal above it,
and it sits a tonal rung down on Muted Surface so the two registers are separated by material rather
than by margin.

`SignalBand` lives in `packages/ui`, so `central`, `hr` and `admin` inherit it. The row vocabulary is
app-local for now and should move beside the band if a second staff application grows a queue.

One behavioural note for reviewers: the band's auto-open commits once every query behind it reports
`isReady`, not on a timer and not on the first non-zero count. `publicRequests` is an on-demand
collection that syncs after the eager ones, so both of the cheaper triggers pick whichever queue
wins the sync race — which reproducibly opened the screen on Upcoming meetings while an aging Public
Request sat unread two cells to the left.
