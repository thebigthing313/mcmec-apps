---
"public": minor
"@mcmec/ui": minor
"@mcmec/lib": minor
---

Rebuild the public masthead as a two-tier identity rail over the navigation, and fit the home page's four bands into one viewport.

The seal now sits on a light ground at 80px, from `logo192` rather than the square-tiled 128px file. Its disc is transparent, so on Commission Green the arced lettering sat straight on the green and dissolved — the old white "puck" was a crude fix for that, and a fully rounded shape besides, which The Pill Is A Status Rule reserves for record state. The identity rail carries the Commission's name and, in the slot and treatment "Established 1914" held, the standfirst that used to open the home page. Below `lg` the Menu button moves into the rail and the green navigation tier goes entirely — a 56px strip holding one button is 56px of a sticky header charged against a phone viewport for the whole visit — and below `sm` the name shortens to MCMEC, the shortening the auth frame's masthead already does. That puts the phone masthead at 65px against the 198px a shared three-band header first measured. The full name and the standfirst move into the navigation sheet, which has the room the rail does not; the sheet keeps "Menu" as its accessible name, because a navigation panel that announces itself as the agency's name tells a screen-reader user nothing about what opened.

The rail renders at every width: it was briefly desktop-only, which cost a phone visitor the seal, the name and the description, and left the two form factors with different information architectures. The mobile puck is gone with it.

The home page drops its visible `h1` and standfirst to the masthead, keeping an `sr-only` heading so the route still has one. The hero splits one third register to two thirds photograph, the six destinations stack as equal cards, and the band is `h-[calc(100svh-10rem)]` — the masthead is deliberately fixed at 104px + 56px so that arithmetic holds — so identity, navigation, photograph and record strip land in one viewport with the footer below the fold. Two columns of destinations between `sm` and `xl`, one below and above.

The footer's band takes a near-black `--footer` / `--footer-foreground` pair instead of borrowing shadcn's `accent`, which is the hover-and-focus state on hundreds of surfaces across five frontends. White on it reads 15.85:1. The standard focus ring measures 1.55:1 on that ground, under what WCAG 1.4.11 asks of a focus indicator, so the band inverts the ring to its own white foreground — the same move Commission Green already makes. The county mark is flattened to white there, since its dark half was within a shade of the new ground.

`VITE_ASSETS_ORIGIN` optionally overrides the brand-image origin, which otherwise stays production. Unset it behaves exactly as the hardcoded origin did; set to a local api it shows images a branch adds before that branch reaches `main`. The public app's CSP reads the same variable so the policy and the page cannot disagree about where images come from.
