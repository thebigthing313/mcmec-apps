---
"@mcmec/ui": minor
"website-management": patch
---

One detail page, and the answer to nine of them

`RecordIndex` ended eleven copies of the same table. The screens those tables linked *to* were
still four different products: a Notice, a Meeting and a Spray Mission put their metadata in
`<h4>`s inside a `.prose` article; a Job Posting used a `<dl>` in one card with its content in
another; a Public Request used a two-column grid of `<p>`s; a Document had a bare link and no
metadata vocabulary at all. Someone who had learned where the date sits on a Notice re-learned it
on every other record.

All nine now compose `RecordDetail`, which fixes two things beyond the arrangement:

- **Metadata is a `<dl>`, not headings.** `<h4>Type: Legal</h4>` under an `<h1>` skips two levels
  and calls a value a section, so the outline a screen reader reads out was a list of sections
  containing nothing. The Insecticides page had already fixed this for itself, with a comment
  saying so; the fix never crossed the folder.
- **The toolbar is not a `<nav>`.** Every page wrapped Back, Edit *and* the lifecycle buttons in
  a navigation landmark. Publish and Archive are not navigation, and DESIGN.md already calls the
  shell's breadcrumb the only wayfinding above the page title.

Three records also change what they lead with, because the index and the detail page disagreed
about what the record *is*:

- A **Spray Mission** is titled by its area with the date as subtitle. It was titled by date, so
  searching the index for a truncated area string landed you on a page called "Aug 14".
- A **Public Request** is titled by the person. The dashboard's aging queue already names the
  resident and puts their address beneath, and then the page it linked to titled itself "Water
  Management" and demoted the person to a grey sub-label.
- A **Job Posting** drops "Closed: Yes" from beside a badge already reading Closed, along with the
  raw Created and Updated timestamps no other detail page shows, and formats its one remaining
  date with `formatDateShort` like the rest of the product rather than the bare
  `toLocaleDateString` this page alone was calling.
