---
"public": patch
---

Close up the masthead's two name lines on desktop

From `lg`, where the agency's name is set at 18px on a rail with room to spare, the two lines
go from `leading-tight` (1.25) to 1.1. The looser leading read as two separate labels stacked
on each other rather than as one two-line name.

Below `lg` the leading is unchanged: the name wraps to three lines on a phone, and tightening
it there would set wrapped words closer than the deliberate line breaks. The standfirst is
unaffected either way — it carries its own `leading-snug`.

A unitless multiple rather than `leading-none`: Tailwind's `leading-none` is the length `1lh`
resolved at the *container's* 16px font size, so the 18px lines would sit in a 16px box and
crop the tail of the Q in "Mosquito".
