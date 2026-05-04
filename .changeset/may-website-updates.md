---
"public": patch
"notices": patch
"@mcmec/ui": patch
"@mcmec/supabase": patch
---

Simplify meeting documents into a single bundled link by dropping the `agenda_url` and `report_url` columns — the consolidated document now lives in `minutes_url`. Updates the notices form, the shared meetings table and mobile list, and the public meetings page to match. Also refreshes the public Job Opportunities page opener with MCMEC's mission and benefits.
