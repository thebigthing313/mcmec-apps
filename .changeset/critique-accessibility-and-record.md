---
"@mcmec/ui": minor
"public": minor
"@mcmec/lib": patch
---

Fix the focus ring across every frontend, clear the shell's reflow failure, and put the public record on the landing page.

The focus ring was `oklch(0.5353 …)` at 50% opacity and `--primary` is `oklch(0.5364 …)` — the same lightness — so on the public navigation bar it measured 1.00:1 against its own ground, and 1.95–2.05:1 on every light surface. It is now opaque and dark (9.47:1 on Paper, 3.27:1 on Brackish Teal), and inverts to the pale foreground on Commission Green (4.62:1). This touches all five frontends.

The public navigation bar needs 842px and was taking over at 768px, so every page scrolled horizontally from 768 to 856 — including a 1536px desktop at 200% zoom. The handover moves to `lg`. The bar also gains a `header` landmark, labels on all four `nav` landmarks, a painted active state driven by the `aria-current` TanStack was already emitting, and 24px touch targets.

The landing page gains a record strip: next Spray Mission, latest Legal Notice with its date, next Public Meeting — each with a written empty state, none of them claiming "tonight". Its queries are capped so the front door renders whether or not the api answers.
