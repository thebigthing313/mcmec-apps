---
"central": patch
"@mcmec/ui": patch
---

Central's first download drops from 225.5 kB to 186.8 kB gzip. Its notices and meetings routes pass `validateRecordIndexSearch` to `validateSearch`, which is never code-split, and importing it from `record-index` pulled the whole table, Select and row-actions menu into the entry chunk. A central build now also records which modules each chunk holds, and `pnpm check-bundle` (run in CI after the build) fails if App code or a table other than `employees` reaches central's entry closure, or if that closure grows past the ceiling in `apps/central/bundle/budget.json`.

`@mcmec/ui`: the record index's search helpers (`RecordIndexSearch`, `validateRecordIndexSearch`, `parseRecordIndexSearch` and the page-size constants) live in a component-free `blocks/record-index-search` module. `blocks/record-index` still re-exports them, so existing imports keep working. Central's routes now import from the new module. The retiring staff apps (website-management, hr, admin) are unchanged and keep their current entry chunks.
