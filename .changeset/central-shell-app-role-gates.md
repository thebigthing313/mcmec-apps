---
"central": minor
"@mcmec/ui": minor
"@mcmec/lib": minor
"@mcmec/auth": minor
---

Central becomes the shell for every staff App. Its root signed-in layout owns the frame, the app switcher, NavUser and the breadcrumb, and reads the claims and the Employee row once. Each App's layout route supplies only its `activeApp` and rail in `staticData`, plus a synchronous `requireAppRole(context.claims, role)` gate. A deep link into an App the User lacks keeps its URL and shows `AppRoleRequired` inside the shell, with the Self Service Portal's rail. A User with no linked Employee is refused full-page at the root. `/`, `/notices` and `/meetings` are now the Self Service Portal, and central gets route tests that are table-driven over the App list.

`@mcmec/lib`: the App list names the Self Service Portal (the `Central` AppName is gone), and an App folded into central has a path as its `href`.

`@mcmec/ui`: `AppRoleRequired` drops `centralUrl` for `to` plus an optional `LinkComponent`, and its action reads "Go to the Self Service Portal". `OnboardingRequired` is renamed `EmployeeRequired`, and both notices' remedy copy names Admin and HR as Apps. The app switcher takes an optional `LinkComponent` for in-app Apps and drops its dropdown when only one App is accessible.

`@mcmec/auth`: `NotOnboardedError` is renamed `NoEmployeeError` (code `NO_EMPLOYEE`), and the new `readClaims` reads the session without applying policy. `verifyClaims` behaves as before.
