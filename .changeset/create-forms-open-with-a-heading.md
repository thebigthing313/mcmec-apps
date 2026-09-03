---
"website-management": patch
---

Give the create screens and the two category editors a page heading

#195 gave eight edit routes an `h1` and left the create routes alone, pending a copy decision;
its note that those eight were the last gap was wrong. Ten form routes in Website Management still
rendered no heading element — all eight create routes, plus the notice-category and
document-category editors, which fell outside the eight #195 enumerated. Each was a page whose
heading hierarchy started empty, so someone navigating by heading found nothing and the first
thing on the page was a form field.

All ten now open with `PageHeader`, in the same Headline treatment as the edit routes: "Create
Notice", "Create Spray Mission", "Edit Notice Category", "Edit Document Category" — the action and
the record type, with the record itself left to the breadcrumb. The wording is the string each
route already passed as `formLabel`, so nothing is renamed; it simply moves from a fieldset
`legend`, which names a field group and never enters the document outline, to the `h1` that does.
Each route drops the now-duplicate `formLabel`, and `CategoryForm` takes the same optional
`formLabel` the other six forms took in #195.

Fields, validation, submit behaviour and navigation on success are untouched. No form route in
Website Management is left without a heading.
