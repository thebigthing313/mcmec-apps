---
"website-management": patch
---

Make publishing a Notice or Document an act, not a switch left on

Creating a Notice opened a form whose "Publish Status" switch defaulted to on. Fill in the
fields, press Create, and a statutory legal notice was on the public website — without anyone
having decided to publish it. The Document form carried the same switch defaulted off, so the
habit learned on one was wrong on the other.

ADR 0001 says a lifecycle state is performed, never set, and grants create no exemption. Both
switches are gone. `is_published` is no longer a form value at all: it travels with the submit's
meta, so the two create buttons — "Create as Draft" and "Create and Publish" — run the same
validation and the form has no publish state to leave in the wrong position. Editing was already
correct and is unchanged.

Also adds the router's missing pending component. The `(app)` shell verifies the session and
preloads the employee row before it renders anything, and until now that gap was a blank page,
which is indistinguishable from a broken one.
