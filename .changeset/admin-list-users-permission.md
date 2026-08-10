---
"api": patch
---

Fix `manage_users` being unable to list users.

The admin app's Manage Permissions screen sat on "Loading users…" while `admin/list-users` returned 403. Our access control declared only the custom `website`/`employees`/`users` statements, but the admin plugin authorizes its own routes against its `user`/`session` statements — so a role built purely from our statements could never satisfy them. `adminRoles` doesn't cover this; the plugin's permission check never consults it.

`defaultStatements` is now spread into the access control, and `manage_users` grants `user: ["list", "get"]` — only what the app calls, since role writes go through our own audited endpoint rather than the plugin's `set-role`.
