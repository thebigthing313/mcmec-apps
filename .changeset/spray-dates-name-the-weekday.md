---
"@mcmec/lib": minor
"public": patch
---

Name the weekday, and tell the clock the way a resident reads it

A spray mission is something a resident plans an evening around — close the windows, bring the
dog in, move the barbecue. "September 04, 2026" and "19:00" both make them do work the page
should have done: count on a calendar to find out whether that is a school night, and subtract
twelve to find out whether it is before or after dinner. Both now read as they are spoken:
"Friday, September 04, 2026", "7:00 PM – 11:00 PM", on the schedule cards and in the front
door's record strip alike.

`formatDateWithWeekday`, `formatDateShortWithWeekday` and `formatClockTime` join
`@mcmec/lib/functions/date-fns`. The clock formatter is a string transform rather than a `Date`
formatter on purpose: a `time` column has no date and no zone to attach one to, and building a
`Date` around it invites exactly the timezone shift that module exists to avoid. The card's
private time helper is gone in its favour, so one rule now governs every clock on the site.

The strip also stops under-reporting a busy night. It has room for one mission, and the
Commission sprays several municipalities on the same date; showing the first alone told a
resident of the second town that their street was not being treated — the one direction a wrong
answer must never point. It now adds "and 2 others" beneath the mission it names.
