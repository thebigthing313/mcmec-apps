> **Archived research note.** Captured 2026-08-24 on branch `research/write-inventory`
> (commit `9873b49`) and merged into `docs/` on 2026-09-01 to preserve it after that branch
> was pruned. It is a **historical snapshot, not current documentation**: it describes the
> codebase *before* the writes-as-named-commands refactor, when writes were scattered across
> app code and bespoke API endpoints. Every write it catalogues now goes through the command
> vocabulary in `packages/domain` with handlers in `apps/api`. Read it for the reasoning that
> produced that design, not as a description of how the code works today.

# Write inventory

Mechanical catalogue of every write in the MCMEC monorepo, produced for [#133](https://github.com/thebigthing313/mcmec-apps/issues/133) (part of the map in #132). No architecture proposed here — this is raw material for naming the command vocabulary.

Snapshot taken from `develop` at `3960d61`.

---

## Summary

**42 distinct writes** across five apps and six API endpoints. Entries are numbered W-1 … W-43; W-34 is a cross-reference to W-43 rather than a separate write, hence 42.

### Counts per table

| Table | Writes | Insert | Update | Delete |
| --- | --: | --: | --: | --: |
| `notice_types` | 3 | 1 | 1 | 1 |
| `notices` | 5 | 1 | 3 | 1 |
| `meetings` | 3 | 1 | 1 | 1 |
| `insecticides` | 3 | 1 | 1 | 1 |
| `document_types` | 3 | 1 | 1 | 1 |
| `documents` | 5 | 1 | 3 | 1 |
| `municipalities` | 0 | 0 | 0 | 0 |
| `spray_schedules` | 3 | 1 | 1 | 1 |
| `mosquito_activity_data` | 1 | 1 (bulk, bespoke) | 0 | 0 (delete-by-year is inside the import) |
| `public_requests` | 3 | 1 (public, bespoke) | 1 | 1 |
| `employees` | 7 | 2 | 3 | 2 |
| `job_postings` | 3 | 1 | 1 | 1 |
| `spray_schedule_municipalities` | 2 | 2 (full-replace, bespoke) | 0 | 0 |
| `users` | 2 | 1 (via Better Auth) | 1 | 1 (rollback only) |

`employees` is 7 because `hr` and `admin` each carry their own byte-identical copy of the add/edit/delete trio, plus the shared `InviteButton` sets `employees.user_id`. `users` writes never go through `/api/data` — that table is not in `WRITABLE`.

**Correction to the map's starting facts:** `WRITABLE` in `apps/api/src/data.ts` holds **12** tables, not 21 (`notice_types`, `notices`, `meetings`, `insecticides`, `document_types`, `documents`, `municipalities`, `spray_schedules`, `mosquito_activity_data`, `public_requests`, `employees`, `job_postings`). Two more tables are written outside it (`spray_schedule_municipalities`, `users`). Likewise the "~143 call sites" figure does not survive excluding `routeTree.gen.ts`: there are **53** raw `.insert(`/`.update(`/`.delete(` hits under `apps/*/src`, of which 36 are app write call sites and the rest are API-internal or unrelated (`createHash().update()`, `headers.delete()`, route registration).

### Writes that touch more than one row or table

- **W-23 / W-24 → W-38 / W-39 — save a spray mission.** One form submit produces two writes: a POST/PATCH to `spray_schedules`, then a `PUT .../municipalities` that deletes every junction row for the schedule and re-inserts the selected set. The user sees the municipality multi-select, but not the junction rows; the two writes are also **not atomic** — on create the schedule is committed first (`await tx.isPersisted.promise`) and a failed junction write leaves a schedule with no municipalities. `apps/website-management/src/routes/(app)/spray-schedule/create.tsx:38-57`, `.../$sprayScheduleId.tsx:91-110`.
- **W-40 — Confirm & Replace These Years (mosquito import).** `DELETE ... WHERE year IN (...)` then chunked inserts of up to 20 000 rows, one transaction. The user is looking at a *count* and a year list, never the rows. `apps/api/src/mosquito.ts:57-68`.
- **W-43 — Send Invite.** Creates a `users` row (Better Auth `createUser`), then updates `employees.user_id`, then triggers a password-reset email. Three effects, two tables; on link failure it hard-deletes the user (cascading to `account`/`session`). The user sees only the employee row. `apps/api/src/invite.ts:49-71`.
- **W-42 — role checkbox in Manage Permissions.** Single row, but a full-replace of a set the user edits one checkbox at a time; the client reads current roles, computes `next`, and PUTs the whole array. `apps/admin/src/routes/(app)/permissions/index.tsx:72-78`.
- **Cascade deletes.** `notice_types`/`document_types` deletes are FK-`restrict`ed (surface as 409), but several other deletes may cascade rows the user cannot see — see Gaps.

### Writes carrying rules enforced only in the form

- **W-3 / W-17 — delete a category.** The delete button is `disabled={category.notices > 0 || isDeleting}` with a tooltip "Cannot delete category with N existing notices". The count comes from a client-side `leftJoin` + `count()` live query. Server-side this is only *incidentally* enforced by the FK `restrict`. `categories.tsx:171-186`, `document-categories.tsx:171-189`.
- **W-1, W-2, W-15, W-16 — category name required.** `disabled={!createForm.name.trim()}` / `disabled={!editForm.name.trim()}` on the dialog buttons only. No `.min(1)` on the wire; a whitespace-only name would be accepted by the API.
- **W-9 / W-10 — meeting notes required when cancelled.** `meetings-form.tsx:71-98`: the `notes` field's `onBlur` validator reads `is_cancelled` off the form and, if set, requires `z.string().min(5)`; `is_cancelled`'s `onChange` re-validates `notes`. Purely client-side — the API's `meetings` insert/update schema has no cross-field rule.
- **W-4 / W-5 — notice 7-day retention warning.** `notice-form.tsx:122-144`: if `is_archived` and `notice_date` is less than 7 days old, renders "Per P.L. 2025, c.72, legal notices must remain on the current notices page for at least 7 days before archiving." It is a **warning only** — it does not block submit, and nothing server-side knows about it. This is a statutory rule living in a JSX component.
- **W-6/W-7, W-20/W-21 — publish / unpublish.** The choice of which write to issue is derived in the component (`const isDraft = !is_published;` then render Publish *or* Unpublish). The server only ever sees `{ is_published: true|false }` and cannot tell "publish" from "correcting a typo in the publish flag".
- **W-26 — request status change.** `RequestStatusEnum.safeParse(next); if (!parsed.success) return;` in the handler, plus the `<Select>` only offering the three labels. Any status transition is legal — there is no ordering rule anywhere.
- **W-23 / W-24 — spray mission status.** `STATUS_OPTIONS` in `spray-schedule-form.tsx:12-17` is a free-choice combobox over `scheduled | delayed | cancelled | completed`. No transition guard, and `rain_date` is not required when status is `delayed`.
- **W-40 — CSV pre-validation.** `parseCsvRows` (`weekly-activity/index.tsx:55-87`) runs `MosquitoActivityDataInsertSchema` per row client-side and refuses to enable the upload button unless *every* row passes (`if (errors.length === 0) setParsedRows(rows)`), and the destructive-variant button is gated on `disabled={isUploading}`. The API re-validates, so this one is duplicated rather than form-only — but the "all rows or nothing" gate is form-only.
- **W-42 — self-lockout guard.** `const isSelfUsers = user.id === currentUserId && role === "manage_users";` disables that one checkbox. The server has **no** equivalent check: a crafted PUT can strip your own `manage_users` role. `apps/admin/src/routes/(app)/permissions/index.tsx:139-140`.
- **W-41 — Turnstile token presence.** `if (!turnstileToken) { toast.error("Please complete the security verification."); return; }` in all four public forms. The API does verify the token, so this is a duplicate rather than a hole; the honeypot short-circuit (`if (honeypot) { navigate to success; return; }`) is client-side theatre on top of the server's own honeypot check.

### Cross-cutting note on server-owned fields

`apps/api/src/data.ts:23` strips `id`, `createdAt` and `updatedAt` from **every** generic write body before parsing (`SERVER_COLS`), so the client-generated `crypto.randomUUID()` and `new Date()` values that every create form assembles are discarded and the DB defaults win. Two consequences worth recording:

1. Every insert call site builds `id`, `created_at`, `updated_at` that never reach the database. They are dead payload that the insert Zod schemas nonetheless *require* (`SpraySchedulesInsertSchema` requires `id: z.uuid()`).
2. Two flows then reuse the discarded client id: `spray-schedule/create.tsx:45` PUTs to `/api/spray-schedules/${value.id}/municipalities`, and `job-postings/new.tsx:26` navigates to `/job-postings/$postingId` with the locally-minted id. Whether those actually resolve depends on whether the optimistic row keeps the client key after sync — **unverified, see Gaps.**

For brevity, the per-write "Server-owned fields" column below does not repeat `id`/`created_at`/`updated_at` unless something specific is at stake.

---

## `notice_types`

### W-1 — insert

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/categories.tsx:101` |
| **Operation** | insert |
| **User-facing action** | "New Category" → dialog titled **Create Category** ("Add a new notice category") → **Create Category** button, on the *Categories* page ("Manage notice categories and their descriptions.") |
| **Fields set** | `id`, `name`, `description` (`createForm.description \|\| null`), `created_at`, `updated_at` |
| **Server-owned** | `id`, `created_at`, `updated_at` (already stripped server-side) |
| **Multi-row?** | No |
| **Rules in the form** | `disabled={!createForm.name.trim()}` (`:292`). Empty description coerced to `null` at the call site. |

### W-2 — update

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/categories.tsx:86` |
| **Operation** | update |
| **User-facing action** | Pencil icon on a category row → dialog **Edit Category** ("Update the name and description for this category") → **Save Changes** |
| **Fields set** | `name`, `description` |
| **Server-owned** | `updated_at` (DB trigger owns it) |
| **Multi-row?** | No |
| **Rules in the form** | `if (!editingCategory) return;` guard (`:84`); `disabled={!editForm.name.trim()}` (`:246`). |

### W-3 — delete

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/categories.tsx:115` |
| **Operation** | delete |
| **User-facing action** | Trash icon on a category row (no confirmation dialog) |
| **Fields set** | — |
| **Server-owned** | — |
| **Multi-row?** | No |
| **Rules in the form** | **Form-only:** button `disabled={category.notices > 0 \|\| isDeleting}`, tooltip "Cannot delete category with {n} existing notice(s)". The count is a client live query (`leftJoin` + `count`). Server-side only the FK `restrict` stops it, surfacing as a 409. |

---

## `notices`

### W-4 — insert

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/notices/create.tsx:30` |
| **Operation** | insert |
| **User-facing action** | "Create New Notice" → form **Create New Notice** → **Create** |
| **Fields set** | whole row: `id`, `notice_type_id`, `title`, `notice_date`, `content`, `is_published`, `is_archived`, `created_at`, `updated_at` |
| **Server-owned** | `id`, `created_at`, `updated_at` |
| **Multi-row?** | No |
| **Rules in the form** | `NoticeForm` (`components/notice-form.tsx`): `title` ≥ 5 chars (`NonEmptyStringSchema(5)`, onBlur); `notice_type_id` must be a UUID (onChange); `notice_date` required (`NonEmptyDateSchema`, onBlur); whole value re-parsed with `NoticesRowSchema` in `onSubmit`. Defaults: `is_published: true`, `is_archived: false`, `notice_date: new Date()`. **Form-only:** the P.L. 2025 c.72 seven-day retention warning (see Summary). |

### W-5 — update (edit)

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/notices/$noticeId_.edit.tsx:62` |
| **Operation** | update |
| **User-facing action** | **Edit** on a notice → form **Edit Notice** → **Update** |
| **Fields set** | `Object.assign(draft, value)` — every field on `NoticesRowType`, so the whole row is offered; TanStack DB diffs it and `crud.ts` PATCHes only `m.changes` |
| **Server-owned** | `updated_at` (the form seeds `updated_at: new Date()` at `:88`, so it *is* sent when other fields change) |
| **Multi-row?** | No |
| **Rules in the form** | Same `NoticeForm` validators as W-4, including the retention warning. Seeded from a live query rather than the loader (`use-form-seed.ts`). |

### W-6 — update (publish)

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/notices/$noticeId.tsx:56` |
| **Operation** | update |
| **User-facing action** | **Publish** button (upload icon) on the notice detail page — shown only when the notice is a draft |
| **Fields set** | `is_published = true` |
| **Server-owned** | arguably a publish timestamp, which does not exist on this table |
| **Multi-row?** | No |
| **Rules in the form** | **Form-only:** `const isDraft = !is_published;` decides which of the two buttons renders (`:73`, `:91-101`). Awaits `tx.isPersisted.promise` then navigates to `/notices`. |

### W-7 — update (unpublish)

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/notices/$noticeId.tsx:65` |
| **Operation** | update |
| **User-facing action** | **Unpublish** button (destructive variant, `ArchiveX` icon), shown only when published |
| **Fields set** | `is_published = false` |
| **Server-owned** | — |
| **Multi-row?** | No |
| **Rules in the form** | Same `isDraft` derivation as W-6. No confirmation despite the destructive styling. |

### W-8 — delete

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/notices/$noticeId_.edit.tsx:70` |
| **Operation** | delete |
| **User-facing action** | **Delete Notice** on the edit page → AlertDialog "Are you absolutely sure? … permanently delete the notice "{title}"" → **Delete** |
| **Fields set** | — |
| **Server-owned** | — |
| **Multi-row?** | No |
| **Rules in the form** | Confirmation dialog only. |

---

## `meetings`

### W-9 — insert

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/meetings/create.tsx:22` |
| **Operation** | insert |
| **User-facing action** | Form **Create New Meeting** → **Create** |
| **Fields set** | `id`, `name`, `location`, `meeting_at`, `minutes_url`, `notice_url`, `notes`, `is_cancelled`, `created_at`, `updated_at` |
| **Server-owned** | `id`, `created_at`, `updated_at` |
| **Multi-row?** | No |
| **Rules in the form** | `MeetingsRowSchema.parse(value)` at both the form's `onSubmit` and again at `:21`. `name` and `location` ≥ 5 chars; `minutes_url`/`notice_url` must be URLs or null. Defaults: `location: COMPANY_INFO.address`, `meeting_at` = today 12:00 local (`:28-29`), `is_cancelled: false`. **Form-only:** notes required (≥5 chars) when `is_cancelled` — see Summary. |

### W-10 — update

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/meetings/$meetingId.tsx:51` |
| **Operation** | update |
| **User-facing action** | Form **Edit Meeting** → **Update**. Covers both editing details and **cancelling** a meeting (the `is_cancelled` switch, labelled "Cancelled" / "This meeting was cancelled."). |
| **Fields set** | `Object.assign(draft, value)` — all of the above minus `id` |
| **Server-owned** | `updated_at` |
| **Multi-row?** | No |
| **Rules in the form** | As W-9, including the cancelled⇒notes rule. Note the switch's description: "Cancelled meetings will still be shown on the public meetings page. If cancelled, put the reason in the notes." |

### W-11 — delete

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/meetings/$meetingId.tsx:59` |
| **Operation** | delete |
| **User-facing action** | **Delete Meeting** → AlertDialog naming the meeting → **Delete** |
| **Fields set** | — |
| **Server-owned** | — |
| **Multi-row?** | No |
| **Rules in the form** | Confirmation dialog only. |

---

## `insecticides`

### W-12 — insert

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/insecticides/create.tsx:21` |
| **Operation** | insert |
| **User-facing action** | Form **Create New Insecticide** → **Create**. Form description: "This insecticides list are only used in the website's page dedicated to mosquito control products that the Commission uses and are not linked to actual activities." |
| **Fields set** | `id`, `trade_name`, `type_name`, `active_ingredient`, `active_ingredient_url`, `label_url`, `msds_url`, `created_at`, `updated_at` |
| **Server-owned** | `id`, `created_at`, `updated_at` |
| **Multi-row?** | No |
| **Rules in the form** | `InsecticidesRowSchema.parse` twice (form `onSubmit` and `:20`). `trade_name`/`type_name` ≥ 5 chars; `active_ingredient` non-empty; all three URLs must parse as URLs (**not nullable** — an insecticide with no MSDS cannot be saved). |

### W-13 — update

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/insecticides/$insecticideId.tsx:51` |
| **Operation** | update |
| **User-facing action** | Form **Edit Insecticide** → **Update** |
| **Fields set** | `Object.assign(draft, value)` |
| **Server-owned** | `updated_at` |
| **Multi-row?** | No |
| **Rules in the form** | As W-12. |

### W-14 — delete

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/insecticides/$insecticideId.tsx:59` |
| **Operation** | delete |
| **User-facing action** | **Delete Insecticide** → AlertDialog naming the trade name → **Delete**. (The map's example phrasing "retire an insecticide" has no counterpart in the UI — the only verb offered is Delete.) |
| **Fields set** | — |
| **Server-owned** | — |
| **Multi-row?** | No |
| **Rules in the form** | Confirmation dialog only. `spray_schedules.insecticide_id` is `onDelete: "restrict"`, so a referenced insecticide 409s. |

---

## `document_types`

Byte-for-byte the same screen as `notice_types`, against documents.

### W-15 — insert

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/document-categories.tsx:101` |
| **User-facing action** | "New Category" on *Document Categories* → dialog **Create Document Category** ("Add a new document category") → **Create Category** |
| **Fields set** | `id`, `name`, `description`, `created_at`, `updated_at` |
| **Server-owned** | `id`, `created_at`, `updated_at` |
| **Multi-row?** | No |
| **Rules in the form** | `disabled={!createForm.name.trim()}`. |

### W-16 — update

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/document-categories.tsx:86` |
| **User-facing action** | Pencil icon → dialog **Edit Document Category** → **Save Changes** |
| **Fields set** | `name`, `description` |
| **Multi-row?** | No |
| **Rules in the form** | `if (!editingCategory) return;`; `disabled={!editForm.name.trim()}`. |

### W-17 — delete

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/document-categories.tsx:115` |
| **User-facing action** | Trash icon, no confirmation |
| **Multi-row?** | No |
| **Rules in the form** | **Form-only:** `disabled={category.documents > 0 \|\| isDeleting}` + tooltip "Cannot delete category with {n} existing document(s)". |

---

## `documents`

### W-18 — insert

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/documents/create.tsx:30` |
| **User-facing action** | "Create New Document" → form **Create New Document** → **Create** |
| **Fields set** | `id`, `document_type_id`, `fiscal_year`, `url`, `is_published`, `created_at`, `updated_at` |
| **Server-owned** | `id`, `created_at`, `updated_at` |
| **Multi-row?** | No |
| **Rules in the form** | `DocumentForm`: `document_type_id` a UUID; `fiscal_year` `z.number().int().min(2000).max(2100)` (plus `min`/`max` on the `<input type="number">`); `url` must parse as a URL ("The URL where the document is hosted (e.g., Google Drive link)."); `DocumentsRowSchema.parse` on submit. Default `fiscal_year = new Date().getFullYear()`, `is_published: false`. |

### W-19 — update (edit)

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/documents/$documentId_.edit.tsx:62` |
| **User-facing action** | Form **Edit Document** → **Update** |
| **Fields set** | `Object.assign(draft, value)` — `document_type_id`, `fiscal_year`, `url`, `is_published`, `updated_at` |
| **Server-owned** | `updated_at` |
| **Multi-row?** | No |
| **Rules in the form** | As W-18. |

### W-20 — update (publish)

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/documents/$documentId.tsx:50` |
| **User-facing action** | **Publish** on the document detail page ("This document is published and will display on the transparency page.") |
| **Fields set** | `is_published = true` |
| **Multi-row?** | No |
| **Rules in the form** | **Form-only:** `const isDraft = !is_published;` chooses Publish vs Unpublish (`:67`, `:85-95`). |

### W-21 — update (unpublish)

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/documents/$documentId.tsx:59` |
| **User-facing action** | **Unpublish** (destructive variant) |
| **Fields set** | `is_published = false` |
| **Multi-row?** | No |
| **Rules in the form** | Same derivation; no confirmation. |

### W-22 — delete

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/documents/$documentId_.edit.tsx:70` |
| **User-facing action** | **Delete Document** → AlertDialog ("permanently delete this document") → **Delete** |
| **Multi-row?** | No |
| **Rules in the form** | Confirmation dialog only. |

---

## `municipalities`

**No write call sites.** The table is in `WRITABLE` (`manage_website`) and `packages/schemas/src/collections/notices.ts:153-159` supplies `MunicipalitiesInsertSchema`/`MunicipalitiesUpdateSchema` — but `allowDelete` is not set and no component ever calls `municipalities.insert/update/delete`. In the UI municipalities appear only as options in the spray-mission multi-select. Presumably seeded by migration; see Gaps.

---

## `spray_schedules`

### W-23 — insert

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/spray-schedule/create.tsx:38` |
| **Operation** | insert |
| **User-facing action** | Form **Create New Spray Mission** → **Create** |
| **Fields set** | `id`, `mission_date`, `start_time`, `end_time`, `rain_date`, `area_description`, `map_url`, `status`, `insecticide_id`, `created_at`, `updated_at` (`municipality_ids` is split off by the form before this call — see W-38) |
| **Server-owned** | `id`, `created_at`, `updated_at`; **`status`** is a candidate — `scheduled`/`delayed`/`cancelled`/`completed` is arguably derivable from `mission_date` + operational events rather than free-typed |
| **Multi-row?** | **Yes — two tables.** Followed by W-38, non-atomically: `await tx.isPersisted.promise` then a separate PUT. If the PUT fails the user gets a toast and stays on the page, with a schedule already committed. |
| **Rules in the form** | `SprayScheduleForm`: `mission_date` required; `start_time`/`end_time` non-empty strings (defaults `19:00`/`23:00`); `area_description` ≥ 5 chars; `insecticide_id` a UUID; `status` a free-choice combobox over the four values, default `scheduled`; `map_url` and `rain_date` unvalidated/optional. **No** rule that `end_time > start_time`, and **no** rule tying `rain_date` to `status: delayed`. **Form-only:** `if (municipalityIds.length > 0)` guards the junction call on create (`:43`) — so a create with zero municipalities issues no junction write at all, while an *edit* to zero does issue one and clears the set. |

### W-24 — update

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/spray-schedule/$sprayScheduleId.tsx:91` |
| **Operation** | update |
| **User-facing action** | Form **Edit Spray Mission** → **Update**. Covers rescheduling (`mission_date`, times), changing product, and setting status to Delayed/Cancelled/Completed. |
| **Fields set** | `Object.assign(draft, value)` — everything except `id` |
| **Server-owned** | `updated_at`; `status` as above |
| **Multi-row?** | **Yes — two tables.** Always followed by W-39 (unconditionally, even when the set is unchanged). The junction write is `await`ed and a failure `return`s before navigation, but the schedule PATCH has already fired. |
| **Rules in the form** | As W-23. The form seed folds the linked municipality ids into the version stamp (`:83-85`) because the junction has no `updated_at` of its own. |

### W-25 — delete

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/spray-schedule/$sprayScheduleId.tsx:116` |
| **Operation** | delete |
| **User-facing action** | **Delete Spray Mission** → AlertDialog ("permanently delete this spray schedule entry") → **Delete** |
| **Multi-row?** | Likely — junction rows go with it. Unclear whether the cascade is declared; see Gaps. |
| **Rules in the form** | Confirmation dialog only. |

---

## `mosquito_activity_data`

The table is in `WRITABLE`, but **no client ever writes it through `/api/data`** — the collection is created without an `insertSchema`/`updateSchema` (`collections/notices.ts:145-149`), so `onInsert`/`onUpdate` are `undefined`. The only write is the bespoke import; see **W-40** under bypass writes.

---

## `public_requests`

Insert is deliberately excluded from `WRITABLE` (`insertable: false`, `data.ts:148-153`); the public path is **W-41**.

### W-26 — update (status triage)

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/public-requests/$requestId.tsx:117` |
| **Operation** | update |
| **User-facing action** | The **Status** `<Select>` on a request detail page — options rendered from `REQUEST_STATUS_LABELS` (`new` / `in_progress` / `resolved`). Changing the select writes immediately; there is no Save button. |
| **Fields set** | `status` |
| **Server-owned** | a resolved-at / triaged-by stamp, which does not exist on this table — the audit trigger is the only record of who changed it |
| **Multi-row?** | No |
| **Rules in the form** | **Form-only:** `const parsed = RequestStatusEnum.safeParse(next); if (!parsed.success) return;` (`:115-116`). No transition ordering. The collection's `PublicRequestsUpdateSchema` also permits contact-field corrections, but no UI exposes them. |

### W-27 — delete

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/public-requests/$requestId.tsx:124` |
| **Operation** | delete |
| **User-facing action** | **Delete Request** → AlertDialog "Delete this request? — This permanently removes the submission, including the submitter's contact details. This cannot be undone." → **Delete** |
| **Multi-row?** | No |
| **Rules in the form** | Confirmation dialog only. |

---

## `employees`

`hr` and `admin` ship identical copies of this screen (`diff` reports the two `add-employee-dialog.tsx` files identical, and the two edit routes differ only by a `crumb` key). Both are listed because both are call sites.

### W-28 — insert (hr)

| | |
| --- | --- |
| **Call site** | `apps/hr/src/components/add-employee-dialog.tsx:30` |
| **Operation** | insert |
| **User-facing action** | **Add Employee** button → dialog **Add Employee** ("Add a new employee record. You can send them an account invite afterward.") → **Add Employee** |
| **Fields set** | `id`, `display_name`, `display_title` (`\|\| null`), `email`, `user_id: null`, `created_at`, `updated_at` |
| **Server-owned** | `id`, `created_at`, `updated_at`, and **`user_id`** — it is only ever legitimately set by the invite endpoint (W-43), never by a person |
| **Multi-row?** | No |
| **Rules in the form** | `display_name` `z.string().min(1, "Name is required.")` onBlur; `email` `ValidEmailSchema` onBlur; `display_title` unvalidated. No `toastOnError` — a failed insert is silent. |

### W-29 — insert (admin)

Identical to W-28. **Call site:** `apps/admin/src/components/add-employee-dialog.tsx:30`.

### W-30 — update (hr)

| | |
| --- | --- |
| **Call site** | `apps/hr/src/routes/(app)/employees/$employeeId_.edit.tsx:39` |
| **Operation** | update |
| **User-facing action** | Form **Edit Employee** → **Update** |
| **Fields set** | `display_name`, `display_title` (`\|\| null`), `email` |
| **Server-owned** | `updated_at`. Note `email` is the key the invite endpoint looks employees up by, so editing it silently rebinds who an invite would reach. |
| **Multi-row?** | No |
| **Rules in the form** | `EmployeeForm` — unread for this inventory beyond its use here; see Gaps. No error toast. |

### W-31 — update (admin)

Identical to W-30. **Call site:** `apps/admin/src/routes/(app)/employees/$employeeId_.edit.tsx:39`.

### W-32 — delete (hr)

| | |
| --- | --- |
| **Call site** | `apps/hr/src/routes/(app)/employees/$employeeId_.edit.tsx:48` |
| **Operation** | delete |
| **User-facing action** | **Delete Employee** → AlertDialog "…permanently delete the employee record for "{display_name}"" → **Delete** |
| **Multi-row?** | Unclear — an employee with a linked `user_id` leaves the `users` row behind, orphaning a login. Not handled anywhere. |
| **Rules in the form** | Confirmation dialog only. No error toast. |

### W-33 — delete (admin)

Identical to W-32. **Call site:** `apps/admin/src/routes/(app)/employees/$employeeId_.edit.tsx:48`.

### W-34 — update `user_id` (server side of the invite)

See **W-43** — the invite endpoint's second effect is `db.update(employees).set({ userId })` (`apps/api/src/invite.ts:64-67`). Recorded here so the `employees` section is complete.

---

## `job_postings`

### W-35 — insert

| | |
| --- | --- |
| **Call site** | `apps/hr/src/routes/(app)/job-postings/new.tsx:17` |
| **Operation** | insert |
| **User-facing action** | Form **New Job Posting** → **Create** |
| **Fields set** | `id`, `title`, `content`, `published_at`, `is_closed`, `created_at`, `updated_at` |
| **Server-owned** | `id`, `created_at`, `updated_at`. **`published_at`** is the interesting one: the form treats it as a user-chosen date whose emptiness *means* draft ("leave empty for draft"), so publication state is encoded in a nullable timestamp the client picks. |
| **Multi-row?** | No |
| **Rules in the form** | `JobPostingForm`: `title` `NonEmptyStringSchema(1)` onBlur. `content`, `published_at`, `is_closed` unvalidated. Defaults `content: {}`, `published_at: null`, `is_closed: false`. **Form-only:** the draft⇔`published_at === null` convention lives entirely in the field's placeholder text and in whatever the public site queries. No error toast. Navigates to `/job-postings/$postingId` using the client-minted id (see the cross-cutting note). |

### W-36 — update

| | |
| --- | --- |
| **Call site** | `apps/hr/src/routes/(app)/job-postings/$postingId_.edit.tsx:39` |
| **Operation** | update |
| **User-facing action** | Form **Edit Job Posting** → **Update**. Also the only way to publish (set a date), unpublish (clear it), or **close** a posting (the "Closed" switch — "This posting is closed and hidden from the public site."). |
| **Fields set** | `title`, `content`, `published_at`, `is_closed` |
| **Server-owned** | `updated_at`; `published_at` as above |
| **Multi-row?** | No |
| **Rules in the form** | As W-35. Nothing prevents `is_closed: true` with a future `published_at`, or a `published_at` in the past on a posting nobody intended to publish. |

### W-37 — delete

| | |
| --- | --- |
| **Call site** | `apps/hr/src/routes/(app)/job-postings/$postingId_.edit.tsx:49` |
| **Operation** | delete |
| **User-facing action** | **Delete Job Posting** → AlertDialog naming the title → **Delete** |
| **Multi-row?** | No |
| **Rules in the form** | Confirmation dialog only. No error toast. |

---

# Writes that bypass the generic CRUD path

## `spray_schedule_municipalities` — full replace of a junction set

`PUT /api/spray-schedules/:id/municipalities` → `apps/api/src/spray-municipalities.ts:26-73`. Gated by `manage_website`. Not in `WRITABLE`; the client collection is read-only (`collections/notices.ts:166-170`).

### W-38 — replace from the create flow

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/spray-schedule/create.tsx:45` (server handler `spray-municipalities.ts:55-64`) |
| **Operation** | delete-all-for-schedule + bulk insert, one transaction |
| **User-facing action** | The **Municipalities** multi-select on **Create New Spray Mission** ("Select the municipalities covered by this spray mission."), committed by the same **Create** button as W-23 |
| **Fields set** | Junction rows of `(spray_schedule_id, municipality_id)`. `spray_schedule_id` comes from the URL, `municipality_id`s from the body; `id` is a DB default |
| **Server-owned** | `id`, `spray_schedule_id` (path param, not body) |
| **Multi-row?** | **Yes — many rows, and a different table from the one the user just filled in.** The user sees a list of municipality *names* in a combobox, never the junction rows. Body schema: `z.array(z.uuid()).max(1000)` deduped by `transform`. |
| **Rules in the form** | **Form-only:** `if (municipalityIds.length > 0)` (`create.tsx:43`) — an empty selection skips the call. Also form-only: the sequencing (`await tx.isPersisted.promise` before the PUT, `create.tsx:41`) exists solely so the FK resolves. |

### W-39 — replace from the edit flow

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/spray-schedule/$sprayScheduleId.tsx:99` |
| **Operation** | same |
| **User-facing action** | Same multi-select on **Edit Spray Mission**, committed by **Update** |
| **Fields set** | same |
| **Multi-row?** | **Yes.** Unconditional — `[]` clears the whole set (the endpoint's own comment: "full replace; `[]` clears every municipality for the schedule"). Combined with W-24 this is two HTTP writes for one button press, in two transactions. |
| **Rules in the form** | On failure: `toast.error(...); return;` — the schedule update has already been sent, so the two can diverge. |

## `mosquito_activity_data` — seasonal CSV import

`POST /api/mosquito-activity/import` → `apps/api/src/mosquito.ts:33-81`. Gated by `manage_website`.

### W-40 — replace a season

| | |
| --- | --- |
| **Call site** | `apps/website-management/src/routes/(app)/weekly-activity/index.tsx:191` (handler `mosquito.ts:57-68`) |
| **Operation** | `DELETE WHERE year IN (years present in payload)` + chunked `INSERT` (500/statement), one transaction |
| **User-facing action** | *Weekly Mosquito Activity* → **Upload CSV Data** ("Every row for the years in the file is replaced; other years are left alone.") → pick file → preview card "CSV parsed successfully" → **Confirm & Replace These Years** (destructive-variant button) |
| **Fields set** | `species_name`, `species_group`, `year`, `week_number`, `mosquito_count`, `rainfall_inches` |
| **Server-owned** | `id` (DB default), `created_at`/`updated_at`; `rainfall_inches` is re-scaled server-side (`r.rainfallInches.toFixed(2)`, `mosquito.ts:51`) for the `numeric(5,2)` column; the *set of years to delete* is derived server-side from the payload (`mosquito.ts:42`), not sent by the client |
| **Multi-row?** | **Yes — up to 20 000 inserts plus an unbounded delete.** The user is looking at aggregate counts ("N rows", "Years: …", "Species Groups: …"), never at individual rows, and never at the rows about to be deleted. |
| **Rules in the form** | **Form-only:** `if (!parsedRows \|\| parsedRows.length === 0) return;` (`:174`); the upload button only renders when `parsedRows` is non-null, which `parseCsvRows` only sets when **every** row validates (`:161-163`); per-row `MosquitoActivityDataInsertSchema.safeParse` with a synthetic `crypto.randomUUID()` (`:73-76`); PapaParse errors block before validation; `disabled={isUploading}`. Server re-validates independently (`importRow`, 1900≤year≤3000, 1≤week≤53, counts ≥0). |

## `public_requests` — public intake

`POST /api/requests` → `apps/api/src/requests.ts:106-156`. **No permission** — anonymous. 64 KB body cap (`app.ts:53`).

### W-41 — submit a request

| | |
| --- | --- |
| **Call site** | `apps/public/src/lib/submit-public-request.ts:43` (TanStack Start server fn, forwarding from four route components) |
| **Operation** | insert |
| **User-facing action** | Four public forms, all ending in a submit button and a toast/redirect to `/contact/request-success`: **Contact Us** (`general_inquiry`), **Adult Mosquito Nuisance Request** (`adult_mosquito`), **Water Management Request** (`water_management`), **Mosquitofish Request** (`mosquito_fish`) |
| **Fields set** | `request_type`, `name`, `email`, `phone`, `address_line_1`, `address_line_2`, `zip_code_id`, `details` (per-type jsonb) |
| **Server-owned** | `id`, `created_at`, and **`status`** — never sent; the DB default supplies the initial `new`. The correct model already: the client cannot name the triage state on intake. |
| **Multi-row?** | No |
| **Rules in the form** | Client: a flattened Zod schema per form mirroring the API contract (`ContactFormSchema` in `contact-us.tsx:22-27`; `AdultMosquitoFormSchema` / `WaterManagementFormSchema` / `MosquitoFishFormSchema` from `@mcmec/schemas/db/public-requests`), `toContactPayload(value)` reshaping snake_case form values into the API's camelCase contact block, plus **form-only** `if (!turnstileToken) { toast.error("Please complete the security verification."); return; }` and an `if (honeypot)` short-circuit that fakes success without calling the server. Server: honeypot (returns `{success:true}` without inserting), Turnstile `siteverify` with the forwarded client IP, and a `z.discriminatedUnion("requestType", …)` that is the source of truth for each type's questions. Note **no form requires at least one location/time checkbox** — an adult-mosquito report with every flag false is valid. |

## `users` — role management

`PUT /api/users/:id/roles` → `apps/api/src/users.ts:25-53`. Gated by `manage_users`. Not in `WRITABLE`.

### W-42 — grant or revoke an app role

| | |
| --- | --- |
| **Call site** | `apps/admin/src/routes/(app)/permissions/index.tsx:58` (handler `users.ts:43-47`) |
| **Operation** | update |
| **User-facing action** | *Manage Permissions* ("Grant or revoke each app's role for users with accounts.") — tick or untick one checkbox in the per-user × per-role grid. Writes immediately; no Save button. |
| **Fields set** | `users.role` (a comma-separated string) |
| **Server-owned** | The **ordering and null-collapsing** already are: `APP_ROLES.filter(r => parsed.data.roles.includes(r))` re-sorts to the canonical order and `roles.length ? join(",") : null` (`users.ts:37-38`). What is *not* server-owned and arguably should be: the self-lockout rule. |
| **Multi-row?** | No — but it is a **full-replace of a set** driven by a single-element UI gesture: `toggle()` reads `parseRoles(user.role)` from the cached list, computes `next`, and PUTs the whole array (`:72-78`). Two admins ticking different boxes concurrently will clobber each other. |
| **Rules in the form** | **Form-only:** `const isSelfUsers = user.id === currentUserId && role === "manage_users";` → `disabled={isSelfUsers \|\| isSaving}` (`:139-150`). The server has no self-lockout check at all. Also form-only: the read-modify-write of the role set itself. |

## `users` + `employees` — employee invite

`POST /api/invite` → `apps/api/src/invite.ts:19-91`. Gated by `manage_employees`.

### W-43 — send an invite

| | |
| --- | --- |
| **Call site** | `packages/ui/src/blocks/invite-button.tsx:30`, rendered by `apps/hr/src/routes/(app)/employees/index.tsx:122`, `.../employees/$employeeId.tsx:36`, and the identical pair in `apps/admin` |
| **Operation** | insert (`users`, via `auth.api.createUser`) + update (`employees.user_id`) + a password-reset email; on link failure, delete (`users`, cascading to `account`/`session`) |
| **User-facing action** | **Send Invite** (mail icon) on an employee row or detail page → badge flips to **Invite Sent**, or **Email Failed** ("Login created, but the email failed to send.") |
| **Fields set** | `users`: `email`, `password` (throwaway `randomBytes(24).toString("hex")`), `name` (from `employee.displayName`), `role: []`. `employees`: `user_id` |
| **Server-owned** | All of it — the client sends only `{ email }`. This is the closest thing in the codebase to an already-command-shaped write. |
| **Multi-row?** | **Yes — two tables plus an email side effect,** and a compensating delete on the rollback path (`invite.ts:69`). The user is looking at one employee row. |
| **Rules in the form** | Client: none beyond `disabled={loading}` and the sent/error state machine. Server-side guards, correctly located: `if (!employee) 404 "no employee record for that email"`; `if (employee.userId) 409 "employee already has a login"`; `role: []` deliberately withheld so `manage_employees` cannot escalate privileges (`invite.ts:44-46`); a failed reset email returns `success:true, emailSent:false` rather than rolling back. |

---

## Gaps

Things this inventory could not resolve.

1. **The `id`-stripping consequence is unverified.** `data.ts:23` strips `id` from insert bodies, so the DB mints a different UUID than the client's `crypto.randomUUID()`. Two flows then use the *client* id — `spray-schedule/create.tsx:45` (junction PUT) and `job-postings/new.tsx:26` (navigation). Either the optimistic row keeps the client key long enough for those to work, or these are live bugs. Determining which needs a runtime check against staging, not code reading. **Flagged, not concluded.**
2. **`EmployeeForm` validators not read.** W-30/W-31's form rules are cited only from the call site. `apps/hr/src/components/employee-form.tsx` and its admin twin were not opened.
3. **Delete cascades not traced.** `apps/api/src/db/schema.ts` was read only around `spray_schedules`. Whether deleting a spray schedule cascades its junction rows, and whether deleting an employee with a `user_id` orphans a `users` row, are unresolved — both affect the "multi-row?" answer for W-25 and W-32/33.
4. **`municipalities` has insert/update schemas but no writer.** Either seeded by migration, or a screen was removed and the collection config left behind. Not determined.
5. **`zip_codes` is read-only everywhere** (no `insertSchema` on its collection, no call sites). Recorded for completeness; if there is a seeding path it is a migration, not application code.
6. **`central` app has zero writes.** The only near-hits are in `routeTree.gen.ts`. `set-password.tsx` goes through Better Auth's own reset endpoint, which writes `account`/`verification` rows outside anything catalogued here — Better Auth's internal table writes (sessions, accounts, verification tokens) are excluded from this inventory by scope.
7. **`notice_types`/`document_types` deletion rule duplication.** The client's "N existing notices" count and the DB's FK `restrict` are two independent enforcements of the same rule with different failure modes (disabled button vs 409 toast). Which is authoritative when they disagree — e.g. a notice created by another user since the live query synced — is not defined anywhere.
8. **No write anywhere sets `updated_at` deliberately.** Several create/edit forms seed `updated_at: new Date()` into their default values, `crud.ts` forwards it, and `data.ts` strips it; the `set_updated_at` trigger owns the column. Harmless today, but it means the field appears in call-site payloads and should not be mistaken for intent.
9. **Suspected but not located:** no bulk/batch action (select-many + act) exists in any list view; every table's actions are per-row. If one is planned, nothing in the current code anticipates it. `apiInsertRows` accepts up to 500 rows and loops one POST per row (`crud.ts:22`, `:95-107`), so the machinery for a batch insert half-exists and is unused.
