# MCMEC Layout

The chrome every staff application wears: `central`, `website-management`, `hr`, `admin`.

An application supplies its identity, its user, its navigation data and its breadcrumbs. The
shell supplies everything else — the rail, the app switcher, the user menu, the header, the
collapsed-state tooltips, the active state, and the persistence of whether the rail was left
open. `DESIGN.md` calls this The Shell Owns The Chrome Rule: an application that hand-builds a
sidebar, header or breadcrumb has forked the system, and four forks is how five applications
stop looking like one.

## The shape

```tsx
<Layout value={/* LayoutContextData, minus the brand */}>
  <Layout.Sidebar>
    <Layout.Sidebar.Header><Layout.AppSwitcher /></Layout.Sidebar.Header>
    <Layout.Sidebar.Content><AppSidebar /></Layout.Sidebar.Content>
    <Layout.Sidebar.Footer><Layout.NavUser /></Layout.Sidebar.Footer>
  </Layout.Sidebar>

  <Layout.Content breadcrumb={/* optional <Layout.Breadcrumb /> */}>
    <Outlet />
  </Layout.Content>
</Layout>
```

`Layout.Sidebar` also exposes `.Nav`, covered below. `Layout.AppSwitcher` and `Layout.NavUser`
take no props — both read the context.

## The context value

```ts
interface LayoutContextData {
  companyLogoUrl: string;   // injected by the shell — not yours to pass
  companyName: string;      // injected by the shell — not yours to pass
  apps: AccessibleApps;     // must come from filterAppsByPermissions()
  activeApp: string;        // must match an AVAILABLE_APPS name
  currentPath: string;      // from useLocation().pathname
  user: { name: string; title: string; avatar: string | null | undefined };
  onLogout?: () => void;
}
```

Three of these are load-bearing in ways worth stating:

**`companyLogoUrl` / `companyName` are not accepted.** `LayoutRoot` omits them from its public
prop type and reads them from `@mcmec/lib/constants`. An application cannot show a wrong mark or
a wrong agency name, which matters for a body whose authority is that the page is its own word.

**`apps` is branded.** Only `filterAppsByPermissions()` produces an `AccessibleApps`, so the
switcher cannot be handed the unfiltered list and offer doors the signed-in user cannot open.
Passing `AVAILABLE_APPS` is a type error, not a bug to notice in review.

**`currentPath` is required.** It is the shell's entire knowledge of routing — `Layout.Sidebar.Nav`
compares destinations against it to decide the active state, which is how `@mcmec/ui` owns the nav
without depending on TanStack Router. Optional would mean an app could quietly render a rail where
nothing is ever current.

## Navigation

Give `Layout.Sidebar.Nav` the destinations; do not hand-roll `SidebarMenuButton` rows.

```tsx
const NAV_GROUPS: Array<LayoutNavGroup<{ to: string }>> = [
  { items: [{ icon: <Home />, label: "Dashboard", linkProps: { to: "/" } }] },
  {
    label: "Publishing",
    items: [
      { icon: <BookOpen />, label: "Public Notices", linkProps: { to: "/notices" } },
      { icon: <Users />, label: "Meetings", linkProps: { to: "/meetings" } },
    ],
  },
];

<Layout.Sidebar.Nav groups={NAV_GROUPS} LinkComponent={Link} />
```

What the shell guarantees, and what four hand-written copies each forgot:

- **A tooltip on every row.** It is the only label a collapsed rail has. Without it, collapsing
  the rail leaves a column of unlabeled glyphs.
- **The active row**, in Commission Green, carrying `aria-current="page"` so location is never
  signalled by colour alone. Matching is by path prefix, so `/notices/42/edit` keeps Notices lit;
  `/` is exempt from the prefix rule or Dashboard would be permanently current.
- **Group labels in the Overline** — uppercase, letterspaced, below the size of what they cover.

`label` on a group is optional and should be omitted rather than filled with a word that divides
nothing. Keep groups to four items or fewer. A rail of three or fewer destinations needs no
headings at all.

`LinkComponent` is injected so this package never imports a router. The only constraint on
`linkProps` is that it carries a `to`.

## Breadcrumbs

`Layout.Content` accepts a `breadcrumb` node; pass `<Layout.Breadcrumb />` built from the router's
matches. The header renders its separator only when a breadcrumb is present, so an application
that passes none gets a clean header rather than a rule dividing nothing.

```tsx
const matchesWithCrumbs = useMatches().filter((m) => isMatch(m, "loaderData.crumb"));
const items = matchesWithCrumbs.map((m) => ({
  href: m.pathname as string,
  label: m.loaderData?.crumb as string,
}));

<Layout.Content
  breadcrumb={
    <Layout.Breadcrumb
      items={items}
      LinkComponent={Link}
      getLinkProps={(href) => ({ activeOptions: { exact: true }, to: href })}
    />
  }
>
```

Two behaviours are handled for you:

- **Crumbs sharing a URL collapse to the first.** A section route and its index are two matches at
  one pathname and both usually declare a crumb; without this the trail reads "Documents /
  Documents". The section route's name wins.
- **The last crumb is never a link.** It renders as `BreadcrumbPage`, which is what emits
  `aria-current="page"`.

One thing the shell cannot do for you: `activeOptions: { exact: true }` above is required. A
TanStack `Link` to `/notices` reports itself active on `/notices/42` and sets `aria-current="page"`
from that, so without it an ancestor crumb claims to be the current page alongside the real one.
The router computes the attribute internally and ignores one passed in from outside, so this has
to be set where the link props are built.

Seed the trail with a crumb on the `(app)` route so it always reaches the dashboard.

## Rail state

`SidebarProvider` writes a `sidebar_state` cookie; `LayoutRoot` reads it back into `defaultOpen`
on mount, so a collapsed rail survives a reload and an app switch. Expanded is the fallback when
the cookie is absent or unreadable.

## Notes

- `SidebarProvider` already supplies a `TooltipProvider`. Applications do not need to add one.
- The staff applications render light theme only; none mounts a theme provider. The `.dark`
  sidebar tokens have known drift — see `DESIGN.md` — so wiring dark mode means revisiting the
  active-row colour.
- Staff layouts are decided at desktop widths but must survive narrow ones. Below the `md`
  breakpoint the rail becomes a sheet rather than truncating, and no destination is lost.
