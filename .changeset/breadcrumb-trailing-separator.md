---
"central": patch
"@mcmec/ui": patch
---

The breadcrumb no longer ends with a separator. When the trail stopped short of the current page (as it does on the refusal shown when a User opens an App without its App Role), the last crumb was followed by a `›` with nothing after it, so the trail read "Dashboard ›". Separators now appear only between crumbs.
