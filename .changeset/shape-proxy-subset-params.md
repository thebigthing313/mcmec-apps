---
"api": patch
"@mcmec/supabase": patch
"@mcmec/supabase-tanstack-db-integration": patch
---

Let on-demand collections sync through the shape proxy.

On-demand syncing sends `log=changes_only` plus `subset__where` / `subset__order_by` / `subset__params` to pull slices rather than whole tables, and the proxy forwarded only its sync-cursor allowlist. The dropped params didn't fail loudly — the collection simply synced nothing, so the 178-row public-requests table rendered as "0 of 0".

The proxy now forwards `log` and any `subset__*` param. That's safe because Electric intersects a subset with the shape's own `where` instead of replacing it: verified against staging, a shape pinned to `status = 'resolved'` returned zero rows for `subset__where: status = 'new'` while such a row existed, and `subset__where: true = true` still returned only the resolved set. A client cannot reach rows the policy excludes.

`public_requests` and `mosquito_activity_data` stay on-demand as intended — both only grow, and pulling them whole on every page load doesn't scale.
