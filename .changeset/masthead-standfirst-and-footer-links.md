---
"public": patch
---

Set the standfirst under the agency's name, and drop Weekly Mosquito Activity from the footer

The masthead's one-line description used to sit at the far right of the identity rail, set in
uppercase with wide tracking, where it read as a second masthead competing with the name rather
than as a description of it. It now sits directly under "Mosquito Extermination Commission" in
sentence case with a full stop — it is a sentence, and setting it as one lets the agency's name
keep the emphasis.

It is also visible at every width now rather than from `md` up. A sticky masthead charges every
pixel against the viewport for the whole visit, which was the argument for hiding it on a phone,
but the sentence is what tells a first-time arrival what this agency does and a phone visitor
needs that more, not less. It runs at 10px below `md` to keep the cost down.

The mobile menu button's label goes `sr-only` below `sm` and returns above it. That gives the
identity block about 50px back at the width where the name and standfirst have the least room to
wrap, taking the name from three lines to two. The label is hidden, not removed: an icon-only
button has no accessible name, and this button is the only route to six of the seven nav groups
on a phone. It keeps a 44px tap target.

In the footer, Other Links no longer carries Weekly Mosquito Activity; the page is still reached
from the Mosquito Surveillance group in the main nav.
