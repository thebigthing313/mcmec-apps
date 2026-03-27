---
"@mcmec/lib": patch
"central": patch
"notices": patch
"public": patch
---

Move shared assets to Supabase Storage. Remove packages/assets, sync-assets build step, and shx dependency. Apps now import asset URLs from @mcmec/lib/constants/assets.
