---
"api": patch
---

Accept timestamps on the generic write endpoints.

`makeCrud` derives its validators from drizzle-zod, which types every `timestamp` column as `z.date()` and so demands a real JS `Date`. A JSON request body can only ever carry a string, so every write touching such a column was rejected with a 422 — `meetings.meeting_at` is `notNull`, which made meetings entirely uncreatable and uneditable through the UI, and `job_postings.published_at` had the same hole whenever it was set.

`POST`/`PATCH /api/data/:table` now convert incoming ISO strings back to `Date` for exactly the columns drizzle reports as `dataType: "date"`, so the coercion tracks the schema instead of a hand-kept list. Columns declared in `string` mode (`notices.notice_date`, `spray_schedules.mission_date`) report `"string"` and are left untouched. An empty string is passed through unchanged so it fails as a missing value rather than as an Invalid Date.
