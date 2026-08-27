---
"@mcmec/ui": minor
"@mcmec/lib": patch
"website-management": patch
"central": patch
"admin": patch
"hr": patch
---

Present an access refusal as a rule, not as a crash

App Roles are the staff applications' central access model, and the single moment a person met
that model, the system called it a failure. A `ForbiddenError` from `beforeLoad` fell through to
`defaultErrorComponent`, which rendered `ErrorDisplay`: a card headed "Sorry about that!", the
message inside a destructive-red alert titled "An Error Has Occurred", and — as the primary
button — "Try Again", wired to `router.invalidate()`. Invalidating re-runs the same permission
check and refuses again. The one action on the screen was a loop, and the copy never said what
was actually wrong.

**Two purpose-built notices replace it.** `AppRoleRequired` names the application, names the App
Role it needs, and names who can grant it: "Website Management requires the Website App Role, and
your account does not have it. Someone with the Users App Role can grant it to you in the Admin
application." It says *App Role* rather than `manage_website`, because the role is the thing a
person can ask for and the permission string is an implementation detail they cannot act on. Its
primary action goes to Central — the one application every employee has, and the one carrying a
switcher listing the applications they can actually open.

`OnboardingRequired` covers the other outcome, an account with no Employee record behind it. It
gets its own screen because no App Role would help: the applications read a person's name, title
and permissions off the Employee, so there is nothing to sign in as. The only action that can
change the outcome from the user's side is signing out — the account may simply be the wrong one
— so that is the only action offered.

**Neither is an `ErrorDisplay`.** No alert, no red, no retry: a lock or a person glyph on muted
ground, ink on paper, the reason in body text and the remedy beneath it. Refusal Red stays
reserved for destructive commands and validation failures, which is what DESIGN.md says it is
for. Genuine failures keep `ErrorDisplay` and keep retry, because a dropped shape request is
exactly the case retry exists for.

**Central loses its hand-rolled version.** It carried its own 27-line `errorComponent` on the
`(app)` route for the not-onboarded case, built from raw `text-gray-600` and `text-red-600` —
the only literal greys left in the staff applications and a break in the hue-150 neutral family.
It now uses the shared notice where the other three keep theirs. Central needs no App Role, so it
wires only the onboarding case.

`ErrorMessages.AUTH.FORBIDDEN` also loses a missing preposition ("permission to this action" →
"permission for this action"), which is still the fallback wherever that string is surfaced.
