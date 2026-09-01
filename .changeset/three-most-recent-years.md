---
"public": patch
"@mcmec/lib": patch
---

Show three years of history on the transparency and meetings pages

Both public lists showed everything the Commission had ever published, so an FY2018 budget sat
with the same weight as this year's and the meetings table's year selector kept growing. Each
list is now windowed to the three most recent years that actually *have* content — not a rolling
cutoff from today, which would empty a page whose category has not been filed in for a while.

On the transparency page the window is counted per Document Category. Budgets filed for FY2026,
FY2025 and FY2024 and audits filed for FY2025, FY2023 and FY2021 both show three entries; gaps
are skipped rather than counted, and a category with fewer than three years shows what it has.
Grouping, alphabetical group order and the fiscal-year-descending sort inside a group are
unchanged.

On the meetings page every meeting at or after now shows, whatever year it falls in — the page
commits to posting legal notices at least 48 hours ahead under P.L. 2025 c.72, so the window must
never hide an upcoming one. Past meetings are limited to the three most recent calendar years
that contain one. The filter is on the meeting's own date and not on whether its minutes are
posted, so a meeting still waiting to be minuted keeps carrying its notice. Three years is
comfortably above the one-year archive minimum the page's own copy promises.

The rule is one helper, `keepRecentYears`, in `@mcmec/lib` — the same computation over a
different year field, an integer fiscal year on documents and the calendar year of `meeting_at`
on meetings — with `keepUpcomingAndRecentYears` layering the "upcoming always shows" half on top,
and `RECENT_YEARS_SHOWN` as the one place the window size is written down.

This is a display filter and nothing else. No row is unpublished, archived or deleted, the staff
apps still show full history, and anything that has dropped off a public page comes back by
changing this filter alone. Neither page's intro copy changed: telling the reader that older
records exist, and how to ask for them, is a public statement with legal weight and is the
Commission's to write.
