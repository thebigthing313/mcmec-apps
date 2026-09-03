---
"@mcmec/schemas": minor
"@mcmec/ui": patch
"public": patch
---

Let residents type the zip code instead of picking it

The three service request forms asked for the zip code through a combobox over the serviced
zip codes, holding the row id directly. That put a custom listbox in the postal-code slot of a
form the browser is already autofilling — name, street, city — so autofill and the dropdown
fought each other on the one field where the browser had the answer ready.

The field is now a plain `autocomplete="postal-code"` input. The route resolves the five digits
to a `zip_codes` row on submit, and a validator checks the code against that same list as it is
typed: `zip_codes` is not a reference list of New Jersey, it is the Commission's service area,
so a code that isn't in it isn't a typo to correct — it is an address we don't service, and the
form now says so in words rather than leaving the resident hunting for an option that was never
in the list. The city beside it is still derived from the code, and a matched code fills it in
as confirmation that the right one was typed.

`TextField` forwards `inputMode` and `maxLength` so the field brings up a numeric keypad and
stops at five digits.
