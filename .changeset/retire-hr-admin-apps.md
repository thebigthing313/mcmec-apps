---
"@mcmec/sync": patch
---

`@mcmec/sync` drops `collections/hr` and `collections/admin`. Only the `hr` and `admin` apps imported them, and those apps are retired now that HR and Admin live in central at `/hr` and `/admin` (#248).
