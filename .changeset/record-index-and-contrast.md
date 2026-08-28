---
"@mcmec/ui": minor
"website-management": minor
---

One index page, and a brand colour that finally passes AA

A critique of `/notices` scored it 13/40 and found the same faults sitting in all eleven staff index routes. Two fixes here: the colour, and the screen.

**The `primary` / `primary-foreground` pair was failing WCAG AA and nobody had measured it.** White-on-Commission-Green measured **4.24:1** against the 4.5:1 floor for normal-size text, and that pair paints every primary button in five frontends, the skip link in `mcmec-layout`, and every filled status badge at 12px. The foreground is lightened to `oklch(0.985 0.0199 112.9333)`, which measures **4.63:1** on the real rendered elements. Commission Green itself does not move — it is a brand commitment — and the warmth stays, because removing the chroma entirely shifts the ratio by 0.02 and buys nothing. DESIGN.md now records the measured number, which it never did before.

**`RecordIndex` replaces the eleven hand-rolled index pages.** The duplication was the argument for extracting it: nine copies of the sortable column header, none emitting `aria-sort`; eight copies of the same forty-five-line pagination footer; six different spellings of the empty state; three incompatible ways of getting from a row to a record; and zero loading states anywhere, so every index announced "No results." while its Electric shape was still streaming. On a statutory public record, "there are no notices" is a sentence with legal weight and must never be said by accident.

The block is opinionated on purpose. `renderRowLink` is required, so an index that cannot be operated by keyboard does not compile — four of the eleven made the whole `<tr>` a click target with no anchor, which left a screen-reader user on a terminal page and cost everyone middle-click and open-in-new-tab. `getRowLabel` is required, because ten triggers all called "Row actions" tell a screen reader nothing about which record is about to change. `state` and `emptyState` are required, because loading and empty are different screens.

It also adds what no individual route was ever going to add for itself: sort, page, size and search persisted in the URL so returning from a record lands where you left; a debounced search field that keeps its own draft (writing each keystroke to the URL loses focus mid-word and turns the back button into an undo log); a live result count; skeleton rows; and a default page size of 25 rather than 10, because these screens are read at a desk on a large display.

Per-domain choices stay with the route — columns, `rowActions` builders, which lifecycle actions a row offers, filter dimensions, default sort — so ADR 0001's seam is preserved exactly: the route owns the command vocabulary and passes it in, and the block never learns it.

**`RowActionsMenu` can now ask first.** A `confirm` on a row action opens an alert dialog naming the record. Unpublishing a Notice removes a statutorily posted legal notice from the public website and previously did it in one click with no confirmation and no acknowledgement, while `delete*` — less publicly consequential — had a whole danger zone. `toastOnError` gained a `success` option for the same reason: a command whose entire effect lands on a website the user is not looking at owes them a sentence when it works.

`/notices` is migrated as the reference implementation and `notices-table.tsx` is deleted. The remaining ten routes are unchanged and still work; they can move over one at a time.
