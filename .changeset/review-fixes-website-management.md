---
"@mcmec/lib": minor
"website-management": patch
---

Close the gaps a code review found in this branch

**The rain date opened a day early.** A `date` column reads back as UTC midnight, and
`<Calendar selected>` compares against the local day — so the Delay dialog highlighted the day
*before* the one printed on the button beside it, everywhere west of Greenwich. An operator who
trusted the highlight and corrected it wrote the wrong rain date to the public spray schedule.
`@mcmec/lib` gains `toLocalDateOnly` and `toDateOnlyString`, the pair a date-only value needs to
survive a round trip through a picker, and the Delay dialog uses them at both ends.

**"Create and Publish" was the less guarded of the two buttons.** `SubmitFormButton` disables
itself on `!canSubmit`; `LifecycleButton` takes a `disabled` this branch never passed. On an
invalid or in-flight Notice, "Create as Draft" was greyed out while the irreversible public act
stayed clickable — the exact inversion the switch removal existed to prevent.

Also in this pass:

- A Pending Job Posting takes the filled Commission Green again. DESIGN.md's Badges section says
  "Published and Pending take the filled Commission Green"; consolidating the two screens' maps
  had quietly canonised the muted variant reserved for finished work.
- A Job Posting's `published_at` is a `timestamptz`, so it is formatted in local time by the new
  `formatTimestampDateShort` rather than by `formatDateShort`, which pins UTC for date-only
  columns and rendered an evening publish as the next day.
- Insecticides gains the Edit row action every other register has. It was the register whose
  records change most often and the one that made an edit three navigations.
- Creating a Job Posting is at `/job-postings/create`, not `/job-postings/new`. The copy had
  already been corrected to "Create"; the URL had not.
- A Document's detail page stops listing Category and Fiscal year beneath a title that already
  reads `${fiscal_year} ${type}`.
