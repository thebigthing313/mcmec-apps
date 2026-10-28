---
"central": patch
---

central now sends cache headers: the app shell always revalidates, so a deploy is picked up on the next page load instead of after a manual reload, and hashed assets are cached for a year
