---
"@mcmec/ui": patch
"website-management": patch
"admin": patch
"hr": patch
---

Give the edit screens the heading every other staff screen already has

Eight edit routes — notices, meetings, documents, insecticides, job postings and spray missions in
Website Management, plus employees in HR and Admin — rendered no heading element at all. Index
screens get their `h1` from `RecordIndex` and detail screens from `RecordDetail`, so these were
staff pages whose heading hierarchy started empty: someone landing there with a screen reader got
no page title, and the first thing on the page was a form field.

Each now opens with `PageHeader`, in the same Headline treatment as everywhere else. The heading
names the action and the record type — "Edit Notice", "Edit Employee" — and not the record itself,
because the breadcrumb already carries that: `Public Notices > <record> > Edit`. Naming the mode is
also the only wording that never wraps.

What used to stand in for a heading was the fieldset legend these forms passed as `formLabel`,
which said the same words in a `legend` rather than an `h1` — a label for the field group, not a
title for the page. The eight edit routes now pass the words once, to `PageHeader`, and omit
`formLabel`; `FormWrapper` already treated it as optional and now says so. Nothing else moves:
fields, validation, submit behaviour and the lifecycle buttons beneath the form are untouched, and
the create routes keep their legends until their own copy decision is made.

Two edit routes are deliberately left alone, because they are outside the eight this issue named
and their copy has not been decided: the notice-category and document-category editors, which
still carry a legend and no heading.
