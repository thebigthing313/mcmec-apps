---
"@mcmec/lib": patch
"@mcmec/ui": patch
"public": patch
---

Show upcoming meetings first on the public meetings page. The Year selector on the
meetings table and mobile list now leads with an "Upcoming" option and defaults to it, so
a meeting scheduled for a future calendar year is visible on first load. The selector's
options come from the meetings themselves, so it can no longer start on a year with no
rows behind it.
