---
"central": patch
"@mcmec/ui": patch
---

Fixes from the Calendar's staging check. Date pickers reach five years ahead instead of stopping at December of the current year, so HR can enter next year's Holidays. The sidebar marks only the deepest matching destination as current, so an App's Dashboard no longer lights up (and announces itself as the current page) beside every screen under it. The Not Found page's image now loads from the api's assets instead of a path central never served.
