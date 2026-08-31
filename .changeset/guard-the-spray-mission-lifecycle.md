---
"@mcmec/ui": patch
"website-management": patch
---

Guard the Spray Mission lifecycle, and ask Delay for its rain date

Cancelling a Meeting asked first and named the meeting. Cancelling a Spray Mission — the record
residents actually close their windows and move pets for — fired on one click with no
confirmation anywhere. DESIGN.md's Confirm Is For The Public rule covers both; it had only been
swept through the domains that were cut over first.

Cancel and Mark Complete now ask, naming the mission and saying what the public schedule will
show. Mark Complete says the part that was invisible: Completed is terminal and offers no
transition back. Reschedule stays unguarded — it puts a mission back on the schedule rather than
taking one off, and it is the undo for the other two.

Delay now collects the rain date `CONTEXT.md` says a delayed mission carries. It was setting the
status and never asking, leaving the record in a state the glossary calls incomplete with nothing
saying so. Setting one is a Save-and-Delay — `updateSprayMissionDetails` then
`delaySprayMission`, one request, one transaction — which is exactly what the domain module
prescribed and nothing had implemented.

The missions index gains those transitions as row actions and a status filter. The register is
seasonal, and out of season the default newest-first sort opened on a wall of Completed missions
with no way to isolate what was still Scheduled. Delay is deliberately absent from the row menu:
it has a rain date to ask for and a menu has nowhere to ask.

`DateTimeInput` accepts `id` and `aria-describedby`, which land on the popover trigger. The date
half of that control is a button rather than an `<input>`, so a `<label htmlFor>` beside it named
nothing — the field read as "button, Select date" with no clue which date it wanted.
