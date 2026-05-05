---
"public": patch
"@mcmec/ui": patch
---

Fix weekly mosquito activity chart rendering when the current year only has a few weeks of data. The week-number domain now spans the union of the current year and the 5-year historical window, so the dashed 5-year average line renders across the full season and the current-year line zero-fills the remaining weeks instead of collapsing to a single point.
