---
"@mcmec/ui": minor
"@mcmec/lib": minor
"website-management": patch
"central": patch
"admin": patch
"hr": patch
---

Close the remaining critique findings on the staff shell

**Two more invariants become types.** `activeApp` was the one field in the layout context with a
documented rule — "must match an `AVAILABLE_APPS` name" — and nothing enforcing it; it is now the
`AppName` union. That also retires the switcher's `if (!activeApp) return null`, which answered a
typo by deleting the sidebar header: the agency's mark and the only route out of the application.
`onLogout` becomes required, because optional meant an application could ship a "Log out" that
did nothing.

**The sidebar stops showing debug text.** All four applications rendered the literal strings
`"[missing name]"` and `"[missing title]"` — placeholders that doubled as the loading state, so
every user saw bracket notation in the sidebar of a public agency's tool until Electric synced.
`user.name` and `user.title` are optional now and `NavUser` renders a skeleton while they are
absent.

**The app switcher answers the question people actually have.** Every application was listed
identically, including the one you were already in, so finding the one you wanted meant reading
all four. The current application now carries a check and an `(current)` announcement for screen
readers — kept in the list rather than filtered out, because seeing where you are is the point.
Each row also shows its description, which was being fetched into context and discarded. DESIGN.md
calls the same copy load-bearing on the public navigation, on the grounds that it is how someone
who does not know the difference picks correctly; a staff member returning to a seasonal task
after eight months is exactly that person.

**The refusal screen offers a way out that fits the likeliest cause.** "Go to Central" assumed the
account was right and the role was missing. When the account is simply the wrong one, Central is
where that same account lands, so there was no route back to a sign-in form from inside the
application. Sign out sits beside it now.

**Headings reach the detail pages.** Nine of them titled the record with an `h2` and no `h1` above
it — a hierarchy that starts at level two. They are `h1` in the Headline treatment now. The eight
edit forms still have no heading at all and are left for a follow-up; each needs a title decided
rather than promoted.

**Smaller things the critique named.** The redundant `TooltipProvider` in three applications is
gone, since `SidebarProvider` has always supplied one and the shell's README says so. Content
padding moves from 16px to the system's 24px step. Two stranded comments in the barrel file,
stated above unrelated exports after an import sort, are removed.
