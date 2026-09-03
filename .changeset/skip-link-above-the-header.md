---
"@mcmec/ui": patch
---

Raise the skip link above the sticky header so it can actually be seen.

The shared `SkipLink` was `z-50` and every sticky app header is also `z-50`. Both are
positioned elements in the same stacking context, so paint order falls to DOM order — and
the header comes later, covering the link completely.

Nothing about this was detectable from the DOM or from a test: the link was first in tab
order, `:focus-visible` matched, the reveal transform applied, and pressing Enter moved
focus to `#main-content`. It was correct in every respect except being visible, which is
the entire point of a bypass link for a sighted keyboard user. Found by tabbing into it on
staging and seeing nothing.
