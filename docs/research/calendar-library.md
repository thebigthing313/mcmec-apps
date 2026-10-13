# Calendar rendering library for central

Research for [#297](https://github.com/thebigthing313/mcmec-apps/issues/297), part of the map in
[#293](https://github.com/thebigthing313/mcmec-apps/issues/293). Captured 2026-10-13 against
`develop` at `ba1517b`.

**Question.** What should draw the Calendar's month grid and agenda list in `apps/central`? The
Calendar shows four kinds of items (Staff Events, Holidays, Meetings, Spray Missions), some of
them multi-day, and has a calendar/agenda toggle. It only displays items. Staff Events and
Holidays are edited in HR, and Meetings and Spray Missions in Website Management, so the
Calendar needs no drag, resize or click-to-create.

**Recommendation.** Build the month grid and the agenda list by hand with a CSS grid, Tailwind
and `date-fns`, which is already a dependency. Keep **FullCalendar v7** (installed from its
shadcn registry) as the fallback if the Calendar later needs week or time-grid views, or drag
to reschedule. Don't use the shadcn `Calendar` (react-day-picker), react-big-calendar or
Schedule-X for this. The reasons are under [Recommendation](#recommendation).

---

## What the repo already has

| Fact | Source |
| --- | --- |
| `packages/ui` depends on `react-day-picker` `^9.13.0` and `date-fns` `^4.1.0` | `packages/ui/package.json` |
| The only user of the shadcn `Calendar` is `packages/ui/src/inputs/datetime-input.tsx`, a date picker | `git grep components/calendar` |
| `@mcmec/lib/functions/date-fns` wraps date-fns, and central already imports it widely (Meetings, Notices, Spray Missions pages) | `packages/lib/src/functions/date-fns.ts`, `apps/central/src/**` |
| central's router uses `autoCodeSplitting: true`, so each route's component is a lazy chunk by default | `apps/central/vite.config.ts` |
| Entry-closure ceiling is **210 kB gzip** (entry chunk plus its static imports) | `apps/central/bundle/budget.json` |

Any of the options below stays out of the entry closure as long as only the Calendar route's
component (or a module it imports) imports it. With `autoCodeSplitting` that holds by default.
The only way to break it is a static import from a module in the entry closure, such as a shared
layout or the registry. **Lazy loading is not a deciding factor here**, but chunk size still
matters because it is what a staff member downloads when they open the Calendar.

## Sizes (measured)

Measured on 2026-10-13: each library was installed in a scratch directory and a minimal month
plus list/agenda entry was bundled with esbuild 0.28 (`--bundle --minify --format=esm`, React,
ReactDOM and the JSX runtime external, since central already ships them), then `gzip -9`. The
figures are JS only, and CSS is listed separately. This measures a real configuration, which is
more accurate than bundlephobia's whole-package figure.

| Option | Entry measured | JS gzip | Extra CSS |
| --- | --- | --: | --- |
| FullCalendar 7.1.2 (`@fullcalendar/react` plus `/daygrid` and `/list` entrypoints, `temporal-polyfill` 1.0.5 bundled) | `<FullCalendar plugins={[dayGrid, list]}>` | **61.1 kB** | `skeleton.css`, imported by the shadcn registry component |
| Schedule-X 4.9.1 (`@schedule-x/react` plus `calendar`, with Preact and `@preact/signals` bundled) | month grid plus list view | **49.7 kB** | `@schedule-x/theme-default` stylesheet (not measured). `temporal-polyfill/global` is also required and not included |
| react-big-calendar 1.20.0 with `dateFnsLocalizer` | month plus agenda | **56.3 kB** (65.7 kB counting date-fns) | `react-big-calendar.css`, 3.1 kB gzip |
| react-day-picker 9.14.0 (`DayPicker`) | bare `<DayPicker />` | **14.7 kB** (20.5 kB counting date-fns) | none (shadcn classNames) |
| Hand-built with date-fns 4 | the ~10 date-fns functions a month grid needs | **6.1 kB**, and mostly already in central via `@mcmec/lib` | none (Tailwind) |

## The options

### 1. shadcn `Calendar` (react-day-picker): not suitable for an event grid

- **React 19:** yes. The peer range is `react >=16.8.0`. 9.14 is installed, and 10.0.2 (2026-09-30) is the latest.
- **Tailwind v4:** yes, it is already styled in `packages/ui/src/components/calendar.tsx`.
- **Accessibility:** good, but for the wrong job. It follows the
  [ARIA APG date picker dialog pattern](https://daypicker.dev/guides/accessibility), and its
  keyboard model (arrows, Page Up/Down, Home/End, Enter/Space to *select*) assumes that picking a
  day is the action. Each day is a `<button>` (the `DayButton`) inside a `<td>` (the `Day`)
  ([custom components guide](https://daypicker.dev/guides/custom-components)).
- **Rendering items in cells:** possible in principle. The custom components guide names "a
  calendar entry in the day cell" as a use case for overriding `Day` or `DayButton`. In practice
  it doesn't work for us:
  - Items that link to their detail page can't go inside `DayButton`, because interactive content
    inside a `<button>` is invalid HTML. Moving them into `Day` beside the button leaves every
    cell with a "select this day" button that does nothing on a read-only calendar.
  - Each day is its own `<td>`, so a multi-day Spray Mission or Staff Event can't be drawn as one
    bar across the week. It has to be repeated in every cell.
  - The `--cell-size` layout is built for a compact picker. Turning it into tall event cells means
    overriding most of the `classNames` map, which is about as much work as building the grid by
    hand.
  - There is no agenda view. The list would be built by hand anyway.
- **License / maintenance:** MIT. Active: 6.9k stars, 12 open issues, last push 2026-09-30.
- **Lazy load:** yes.

### 2. FullCalendar v7: the best library, and the fallback

- **React 19:** yes. `@fullcalendar/react` 7.1.2 (published 2026-10-12) has peer range
  `react ^17 || ^18 || ^19`. v7 is *"no longer a connector around internal Preact rendering"* and
  is implemented in React, with StrictMode and SSR support
  ([v7 changelog](https://fullcalendar.io/docs/upgrading-from-v6)). Standard plugins are now
  entrypoints of the React package (`@fullcalendar/react/daygrid`, `/list`). Ships as ESM only.
  `temporal-polyfill` is a peer dependency, and FullCalendar doesn't install it globally.
- **Tailwind v4:** the best fit of the libraries. v7 removed the bundled CSS and the `fc-*`
  classes, and adds class-name props for each element plus a
  [shadcn registry](https://fullcalendar.io/docs/shadcn).
  `npx shadcn add @fullcalendar/<flavor>-event-calendar` copies `event-calendar.tsx`, its toolbar
  and views into the repo (shadcn-style, editable), installs the shadcn `button` and `tabs`
  components, and *"inherits all style variables from the Shadcn theme"*.
- **Accessibility:** per the changelog, *"All calendar views now pass Axe accessibility testing"*.
  Events without a URL get `role=button`, the toolbar uses `aria-label`, table semantics are
  improved for screen readers, the List view is structured as a list, and the "+more" popover is
  keyboard navigable. Nothing is documented about arrow-key movement between days in DayGrid. The
  source shows `role="row"`/`"rowgroup"` but no arrow-key handler.
- **Multi-day items, "+N more" overflow, list (agenda) view, view switching:** all built in. This
  is what the library adds over building it by hand.
- **License:** the standard packages, including daygrid and list, are MIT. Premium (scheduler or
  resource) packages are AGPLv3 or commercial, and we wouldn't use them.
- **Maintenance:** very active. 20.7k stars, last push 2026-10-12. v7 is new, though (1,141 open
  issues across all versions), so expect early 7.x fixes.
- **Size:** 61.1 kB gzip JS in a lazy chunk.
- **Lazy load:** yes.

### 3. Schedule-X: workable, but runs Preact inside our React app

- **React 19:** the peer range of `@schedule-x/react` 4.1.0 includes `^19`. The calendar itself
  renders with **Preact plus `@preact/signals`** (peer dependencies of `@schedule-x/calendar` 4.9.1),
  so central would run a second renderer. Its `temporal-polyfill` peer is pinned to `0.3.2`,
  which would clash with FullCalendar's `^1.0.1` if both were ever present. The
  [React guide](https://schedule-x.dev/docs/frameworks/react) has you
  `import 'temporal-polyfill/global'` and size the wrapper yourself.
- **Tailwind v4:** weak. Styling comes from the `@schedule-x/theme-default` stylesheet and its own
  variables. You can inject custom components, but they render through the Preact host.
- **Accessibility:** no accessibility documentation found. The source gives events
  `role="button"` and `tabIndex: 0`, and the day-events modal `role="dialog"`. No grid or gridcell
  roles were found in the month grid.
- **License:** MIT core. Drag-and-drop, resize, drag-to-create, the interactive event modal,
  resources and more are **Premium** (€479/yr or €999 lifetime,
  [schedule-x.dev/premium](https://schedule-x.dev/premium)). We need none of them.
- **Maintenance:** active. 2.6k stars, 57 open issues, last push 2026-10-13.
- **Size:** 49.7 kB gzip JS, plus the theme CSS. **Lazy load:** yes.

### 4. react-big-calendar: legacy, and not a fit

- **React 19:** peer range `^16.14.0 || … || ^19`. The code is older class-based React that
  depends on `lodash`, `prop-types`, `react-overlays`, `uncontrollable`, `dom-helpers` and others,
  and npm also installs `moment`, `luxon`, `dayjs` and `globalize` as dependencies even if you
  choose the date-fns localizer.
- **Tailwind v4:** poor. It ships its own CSS or SASS (`lib/css/react-big-calendar.css`), and the
  [README](https://github.com/jquense/react-big-calendar) warns that overriding styles can break
  rendering. The documented date-fns localizer targets date-fns v2, and we use v4.
- **Accessibility:** minimal. The month view is `role="table"` with `aria-label="Month View"`,
  `role="row"`/`"cell"` and `columnheader` headers. Day cells have no keyboard navigation, and
  only events get an `onKeyDown`.
- **License / maintenance:** MIT. 8.8k stars, last release 1.20.0 on 2026-06-01, and the repo has
  moved to the `bigcalendar` org. Maintained, but slowly.
- **Size:** 56.3 kB gzip JS, plus 3.1 kB CSS. **Lazy load:** yes.

### 5. Hand-built CSS grid with date-fns: recommended

- **React 19 / Tailwind v4:** native. It's our own components in `packages/ui` or
  `apps/central`, with no extra runtime.
- **Accessibility:** whatever we build. The target is the
  [WAI-ARIA APG Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)
  (`role="grid"`, `row`, `gridcell`, `columnheader`, roving `tabIndex` with arrow keys, Home/End,
  Page Up/Down for months). A simpler valid alternative is a semantic `<table>`. In that version
  each day is a cell with a visually hidden date heading, each item is an ordinary link, and Tab
  moves through items rather than empty days. The agenda view is a plain `<ol>` grouped by date,
  which is the most accessible view of the data and a natural screen-reader path.
- **What we'd write:**
  - Grid dates: `startOfWeek(startOfMonth(m))` to `endOfWeek(endOfMonth(m))` through
    `eachDayOfInterval`, chunked into weeks.
  - Multi-day bars: for each week, clip each item to the week, sort by start then length, and
    assign it the first free lane. Render each bar with `grid-column: start / span n` on a
    7-column grid. That is about 100 lines and easy to unit-test.
  - Overflow: show N lanes, then "+k more" (a `Popover` from `packages/ui`).
  - A month header with prev/next/today, and a calendar/agenda toggle (`Tabs`, or a search param
    to match the `?year=` convention on the Holiday Schedule).
  - Per-kind styling for the four item kinds, using existing tokens.
- **Size:** about 6 kB gzip of date-fns, mostly already in central's chunks, plus our own code.
- **License / maintenance:** ours. **Lazy load:** yes.
- **Cost:** more code than FullCalendar, but all of it is plain and testable, and the normalized
  item shape that #293 still has to settle ("Time handling across sources") is the same work
  under any option.

### Others checked and set aside

| Library | Why not |
| --- | --- |
| MUI X Scheduler (`@mui/x-scheduler` 9.0.0-beta.13) | Still beta, and needs `@mui/material` and Emotion as peer dependencies. Wrong design system |
| Toast UI Calendar (`@toast-ui/react-calendar` 2.1.3) | Last published 2022-08-16. Unmaintained |
| EventCalendar (`@event-calendar/core` 5.17.1, MIT) | Active, but implemented in Svelte, so it would be a second framework runtime, the same objection as Schedule-X |
| react-aria-components (Apache-2.0) | Its `Calendar` is a date *picker* with the same limits as react-day-picker. Useful only if a hand-built grid wanted borrowed focus management |

## Recommendation

**Build it by hand: a CSS-grid month view and an `<ol>` agenda list, with date-fns and Tailwind.**

1. The Calendar is read-only and shows only month and agenda views. Drag, resize, time grids and
   recurrence editing are what a library like FullCalendar is for, and we need none of them. What
   remains is date math (date-fns, already a dependency), a lane-packing function for multi-day
   bars, and markup.
2. It's the only option that fits the shadcn/Tailwind v4 design system with no extra stylesheet
   and no second renderer. It adds about 6 kB to the route chunk, against 50–61 kB for the
   libraries.
3. Accessibility is under our control. A semantic table or APG grid plus a list-based agenda can
   meet the bar the libraries reach, and the agenda view gives screen-reader users the simplest
   path.
4. **The shadcn `Calendar` is not a shortcut.** Its day button can't contain links, it can't draw
   multi-day bars across a week, its compact `--cell-size` layout would need most of its
   classNames overridden, and it has no agenda view. Keep it for the date *picker* in
   `datetime-input.tsx`.

**Fallback:** if the spec grows to week or day time grids, drag to reschedule, or dense
multi-day overflow that the hand-built version handles badly, use **FullCalendar v7** through its
shadcn registry (`@fullcalendar/react`, MIT standard plugins, React-native, Axe-clean, about
61 kB gzip in the Calendar's lazy chunk). Install it into `packages/ui` and import it only from
the Calendar route. Avoid Schedule-X (Preact runtime, its own theme) and react-big-calendar
(legacy dependencies, its own CSS, weak accessibility).

## Sources

- npm registry metadata (`registry.npmjs.org/<pkg>`) for versions, licenses, peer dependencies and publish dates: `@fullcalendar/react`, `@fullcalendar/core`, `@schedule-x/react`, `@schedule-x/calendar`, `react-big-calendar`, `react-day-picker`, `date-fns`, `@mui/x-scheduler`, `@toast-ui/react-calendar`, `@event-calendar/core`, `react-aria-components`
- GitHub API (`repos/<owner>/<repo>`) for stars, open issues and last push: fullcalendar/fullcalendar, schedule-x/schedule-x, bigcalendar/react-big-calendar, gpbl/react-day-picker
- FullCalendar v7 changelog: https://fullcalendar.io/docs/upgrading-from-v6
- FullCalendar shadcn registry: https://fullcalendar.io/docs/shadcn
- Schedule-X React guide: https://schedule-x.dev/docs/frameworks/react
- Schedule-X Premium: https://schedule-x.dev/premium
- react-big-calendar README: https://github.com/jquense/react-big-calendar
- DayPicker custom components: https://daypicker.dev/guides/custom-components
- DayPicker accessibility: https://daypicker.dev/guides/accessibility
- WAI-ARIA APG Grid pattern: https://www.w3.org/WAI/ARIA/apg/patterns/grid/
- Library source, inspected after install, for ARIA roles and key handlers: `@fullcalendar/react/chunks/*`, `@schedule-x/calendar/dist/core.js`, `react-big-calendar/lib/{Month,DateContentRow,Header,EventCell}.js`
- Size measurements: esbuild 0.28.2 bundles of the entries described under [Sizes](#sizes-measured), gzip -9
