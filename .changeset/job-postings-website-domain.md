---
"website-management": minor
"hr": minor
"api": minor
"@mcmec/schemas": major
---

Job Postings authoring moves from `hr` to `website-management`, on named commands

**Who can do this changes.** A job posting is content published to the public website, so
#134 put `job_postings` in the `website` domain, where its commands inherit `manage_website`.
Authoring it from `apps/hr` — an app gated end to end on `manage_employees` — would have made
every save a 403. A per-command permission override was considered and rejected: job postings
are not an exception to website ownership, the screens were simply in the wrong app. So the
screens moved.

An HR-only user loses access to job postings entirely, including the ability to read drafts
and closed postings. A website-manager gains it. The public careers page is unchanged — it
reads the anonymous published-and-open shape, which is untouched.

**Both gates moved, not just the write one.** `apps/api/src/shapes.ts` restricted the full
`job_postings` shape to `manage_employees`; a read rule that disagreed with the write rule
would have left the authoring screens able to save a draft they could not then see. The
legacy `/api/data/job_postings` entry moves to `manage_website` for the same reason — it is
dead weight the cutover deletes, but leaving it on the old permission would keep a door open
that contradicts the move.

**Seven named commands** replace the generic CRUD for this table: `website.createJobPosting`,
`updateJobPostingDetails`, `publishJobPosting`, `unpublishJobPosting`, `closeJobPosting`,
`reopenJobPosting`, `deleteJobPosting`. Both lifecycle columns are omitted from
`updateJobPostingDetails`, so they can only move through a command that names the transition,
and every audit row now carries that name.

**`published_at` becomes server-owned.** It was a date picker whose emptiness *meant* draft
("leave empty for draft"), so publishing was spelled as typing a date — and backdating or
future-dating a posting was a normal thing the form invited. `publishJobPosting` stamps
`now()`. The form loses the date field and the Closed switch and gains Publish/Unpublish and
Close/Reopen actions; a new posting is always a draft.

The `pending` status (a publish date in the future) is now unreachable for new writes.
`getJobPostingStatus` keeps the branch for rows written before this landed.

**`@mcmec/schemas` is a major** because `HrCollections` no longer carries `jobPostings` — the
collection moved to the website-management factory and onto the command write path, losing its
Insert/Update schema pair (a command payload is not "a row minus the server columns"). The
schemas themselves stay in `db/job-postings.ts`, still used by the generic path until the
cutover deletes it.
