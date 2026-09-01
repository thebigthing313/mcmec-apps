---
"@mcmec/ui": minor
"website-management": minor
---

Give every re-keyable value on the Public Request detail screen its own copy button.

`@mcmec/ui` gains a `CopyButton` block: one value, one button, confirming by icon swap and
raising an error toast only when the clipboard write is refused. `RecordDetail` takes an opt-in
`titleCopyText`, and `RecordDetailField` an opt-in `copyText` — the eight other detail screens
pass neither and are unchanged.

On Public Requests the metadata list now shows address line 1 and line 2 as separate rows and
zip code, city and state as three, so each button copies exactly the string beside it rather
than the joined, em-dashed version composed for reading. The details panel copies each free-text
block, and the "Reported" group copies its true flags as one comma-joined line.
