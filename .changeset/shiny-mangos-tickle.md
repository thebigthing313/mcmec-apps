---
"@mcmec/ui": minor
"@mcmec/lib": minor
"central": minor
"admin": minor
"hr": minor
"website-management": minor
---

Rebuild the staff auth screens as one shared surface

The four staff applications had four front doors. Central had a real `_auth` layout
with a split-screen building photograph; admin, hr and website-management each carried
their own hand-rolled copy of the same login card, differing only in their title. None
of those differences were decisions, and one SSO cookie already spans all four.

They now share `AuthShell` — a hairline frame inset from every viewport edge, with the
Commission's name breaking across the top rule and the destination application opposite
it, the office address and `Established 1914` across the bottom. The form sits inside on
an unbounded register rather than in a card. Sign-in, password reset and the invite flow
are shared blocks, and password recovery lives in Central for all four apps.

Behaviour kept: the same-origin redirect guard, the deliberately non-committal "if an
account exists" reset confirmation, and every token-failure message. Behaviour gained:
`autocomplete` on password fields, which three of the four logins set by hand and
central set nowhere, and a reserved status line so a failed sign-in no longer shoves the
button out from under the cursor.
