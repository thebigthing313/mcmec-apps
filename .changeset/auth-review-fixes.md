---
"@mcmec/ui": patch
"@mcmec/lib": patch
"central": patch
"admin": patch
"hr": patch
"website-management": patch
---

Close the gaps a code review found in the auth rebuild

**`prefers-reduced-motion` did nothing.** The override sat inside `@layer base` while
`.animate-rule-x` is generated from its theme token into Tailwind's `utilities` layer, and layer
order beats specificity — so the rule animated for everyone, including the people who had asked
it not to. The file documents this exact trap twelve lines further down, where the `.prose` block
explains why it is deliberately unlayered. The media query is now unlayered too.

**The email fields lost `type="email"`.** Three of the four hand-rolled logins set it themselves;
the shared `TextField` hardcoded `type="text"`, which took the email keyboard off every phone and
the browser's own address check off every sign-in. `TextField` forwards a `type` now, and both
auth email fields pass `email`.

Also in this pass:

- The masthead's corner stubs draw with the rule they belong to. They carried `origin-left` /
  `origin-right` and no animation, so the line arrived as a middle section growing between two
  pieces that were already there — not what DESIGN.md's Motion section describes.
- `safeRedirect` is one function in `@mcmec/lib` rather than four copies. Three staff apps had
  byte-identical private versions and Central had it inline as a Zod refinement. The guard that
  refuses `//evil.example` is the half a re-implementation forgets, and it is not the kind of
  thing that should live in four places.
- `AuthStatus` drops the `tone` prop no caller passed and takes its own `mt-4`, which both call
  sites were adding around it.
