---
"central": minor
"@mcmec/lib": minor
"website-management": patch
---

Website Management moves into central at `/website-management`, gated by `manage_website`. Its index is the Signal Strip dashboard, and every screen moves over with its path unchanged under the new prefix, apart from two renames: `spray-schedule` is now `spray-missions` and `categories` is now `notice-categories`. The editable notices and meetings are at `/website-management/notices` and `/website-management/meetings`; the Self Service Portal keeps its read-only `/notices` and `/meetings`, and both read the same collections.

Each screen asks the session registry for only the tables it reads, so entering the App loads nothing until a screen needs it. The two tables that only grow, Public Requests and Weekly Mosquito Activity, join the registry as on-demand collections: they open no stream until a screen's live query asks for its slice. A User without `manage_website` who deep-links into the App keeps the URL, sees the refusal, and loads none of its tables.

Central now shows toasts: write failures, refusals in the server's own words, and confirmations such as "is now on the public site". It had never mounted a toaster, so HR's error toasts were also invisible until now.

`@mcmec/lib`: the App list's Website Management entry is now the path `/website-management`, so central's switcher links to it with the router. In the retiring `website-management` app, that entry now opens central's `/website-management`.
