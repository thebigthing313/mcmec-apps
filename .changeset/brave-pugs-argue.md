---
"@mcmec/ui": minor
"public": minor
---

Make Weekly Mosquito Activity readable without seeing it

The page rendered eight charts and nothing else. To assistive technology it was eight unlabelled SVGs, and the plotted figures existed nowhere else on the page — chart-only data with no text equivalent, which is WCAG 1.1.1 at Level A.

**Each chart now carries its numbers.** A `Show the numbers` disclosure under every chart opens a real table — week, current-year count, five-year average, rainfall — with a caption, column headers, and the week as a row header. Closed by default, so the page looks as it did, but open to anyone: a resident who wants the actual count for their week no longer has to read it off a line.

**Each chart is one labelled image rather than a heap of fragments.** `role="img"` with a summary label collapses the recharts subtree, which would otherwise announce a stream of unlabelled groups and tick text that conveys nothing. The label names the series and the week range and says the figures follow in a table.

**Each chart title is a heading.** `CardTitle` renders a `div`, so eight titles sat on the page and none appeared in the heading outline — the page's only headings were its `h1` and the footer's. They are `h2`s now, each labelling a `section`.

**The series colours come from the palette.** They were `#000000`, `#ec4899` and `#3b82f6` — hex literals in a product whose tokens are the visual authority. The current year takes Commission Green, the five-year average takes `chart-1` and stays dashed so the two are distinguished by stroke pattern and not by colour alone, and rainfall takes `chart-5`.

**The chart palette itself was unusable and is now fixed.** Measured against the card ground, `chart-2` came out at 1.90:1, `chart-3` at 2.17:1, `chart-4` at 1.49:1 and `chart-5` at 1.85:1 — all under the 3:1 that WCAG 1.4.11 requires of a graphical object carrying meaning. They were pastels, which work as large filled areas and fail as plotted lines. Each hue is kept and its lightness pulled down until it clears 3:1, with chroma raised to stay vivid; `chart-1` already passed and is unchanged. Nothing else in the monorepo consumed these tokens, so the change is contained to this chart. New ratios: 3.68, 4.00, 3.86, 3.65, 3.46.

The rainfall bars were also drawn at `opacity={0.3}`, putting them at **1.41:1** — the one element on the chart with a filled area was the hardest thing on it to see. They render at full opacity now.

`DESIGN.md` is updated to match: the new values, why they moved, and the note that the current-year series is drawn in Commission Green rather than from the series palette.
