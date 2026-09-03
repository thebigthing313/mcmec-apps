---
"@mcmec/ui": minor
"public": patch
---

Give Brackish Teal a foreground that actually contrasts with it

The public footer measured 2.17:1, the worst contrast on the site, on the band carrying the office address, phone number and Transparency link on every page. Chasing it found the real defect one level up.

`--accent-foreground` was a near-white on `--accent`, a mid-tone teal: **2.86:1**, well under the 4.5:1 AA floor for normal text. The footer only made it worse by adding a `/70` alpha on top. And that pair is not a footer choice — it is shadcn's hover and focus state, so 2.86:1 was every hovered dropdown item, menubar entry, context-menu row, command item, calendar cell and outline button **across all five frontends**. DESIGN.md named the pair Brackish Teal and Brackish Teal *Contrast*, which is presumably how it survived this long: the token was named for a property it did not have.

`--accent-foreground` is Ink now: **5.22:1** on the same teal, one token, fixing every one of those surfaces at once. Brackish Teal itself is untouched. Darkening the ground to rescue the near-white would also have cleared AA, but it was rejected on appearance rather than on the ratio: the teal is a hover tint on hundreds of surfaces, and taking it that dark makes every one of them visibly heavier to rescue the foreground that was at fault. Light mode only: in dark mode `--accent` is a near-black whose near-white foreground already measures 14.48:1, where Ink would be 1.05:1.

The footer drops its `/70` and keeps its teal ground.

**Also fixed, found while measuring:** the public nav bar's link hover and focus used `accent/40`, a pale teal laid over Commission Green. It lifted the ground and took the white label from 4.62:1 at rest to **3.96:1** — so pointing at a nav link, or tabbing to it, was the one interaction on the page that pushed it under AA. Hover and focus now darken the green instead of lightening it, at 5.56:1.

`DESIGN.md` moves with the tokens, as it did for the chart palette. The `brackish-teal-contrast` entry is gone rather than restated — it held the near-white, and its replacement is Ink, which the palette already names; a second token for one colour, still called *contrast*, would re-create the naming that hid this. `button-outline-hover` now cites `{colors.ink}` directly, the Brackish Teal entry records the pair and the ratio it lacked, and the public nav bar's darkening hover is written down as the stated exception it is.
