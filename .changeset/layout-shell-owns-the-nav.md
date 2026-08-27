---
"@mcmec/ui": minor
"@mcmec/lib": minor
"website-management": patch
"central": patch
"admin": patch
"hr": patch
---

Give the layout shell the nav, so four applications stop rebuilding it

DESIGN.md says the shell owns the chrome. It did not: `Layout.Sidebar.Content` was a slot, and
each of the four staff applications filled it with its own copy of the same
`items.map(SidebarMenuItem → SidebarMenuButton asChild → Link)` block. All four copies
independently omitted the same two props, which is the tell that the seam was in the wrong place
rather than that four people were careless.

**`Layout.Sidebar.Nav` renders the rail now, and applications supply data.** It takes groups of
`{ label, icon, linkProps }` and owns the two things everyone forgot. `tooltip` is what makes the
icon-collapsed rail navigable at all — `SidebarMenuButton` has always supported it, rendering
only while collapsed, and nobody passed it, so collapsing Website Management produced eleven
anonymous glyphs including four near-identical document metaphors in a row. `isActive` is what
tells a user where they are; without it nothing in the chrome ever changed between screens and
the one place DESIGN.md spends Commission Green on state never fired. The active item also
carries `aria-current="page"`, because the active state must not be carried by colour alone.

Active matching is prefix-based so a drill-down keeps its parent lit — standing on
`/notices/42/edit` shows Notices as current — with `/` exempted, since a loose root match would
light Dashboard on every screen and mean nothing.

`LinkComponent` is injected exactly as `LayoutBreadcrumb` already injects it, so `@mcmec/ui`
still has no router dependency. The shell's entire knowledge of routing is one new required
context field, `currentPath`, which each application sets once from `useLocation()`. Required
rather than optional: an app that forgot it would render a rail where nothing is ever current,
which is the state this field exists to end.

**The unfiltered app switcher is now a compile error.** Three applications passed
`filterAppsByPermissions(...)` to the switcher and Website Management passed `AVAILABLE_APPS`
straight through, so from that app the switcher advertised HR and Admin to people without the
roles to enter them — a dead end the chrome manufactured. Both values were `App[]`, so nothing
caught it. `filterAppsByPermissions` now returns a branded `AccessibleApps`, which the layout
context demands and only that function can produce. Website Management passes the filtered list;
the type makes the old mistake unrepresentable rather than something to remember.

**The rail remembers whether it was collapsed.** `SidebarProvider` has always written a
`sidebar_state` cookie and nothing ever read it, so the setting was lost on every reload — and
since switching applications is a cross-origin page load, that was constantly. `LayoutRoot` now
reads it back into `defaultOpen`, defaulting to expanded when it is absent or unreadable.

**Smaller things in the same surfaces.** The header's vertical rule now renders only when there
is a breadcrumb beside it to divide; three of the four applications pass none, and each was
drawing a dangling stroke in otherwise empty chrome and announcing a separator before no content.
It is `aria-hidden` when it does appear. Website Management's eleven destinations are grouped —
Publishing, Operations, Intake, Categories, each four items or fewer — instead of sitting flat
under a heading reading "Menu"; the two- and three-item rails drop their heading entirely rather
than label it with a word that divides nothing. Central's sidebar showed a group headed "My Apps"
over empty content, a promise of a list that was never built on the one application every
employee has, and now shows its one real destination. Central's error screen swaps `text-gray-600`
and `text-red-600` for `text-muted-foreground` and `text-destructive`, the only raw greys left in
the staff applications and a break in the hue-150 neutral family.
