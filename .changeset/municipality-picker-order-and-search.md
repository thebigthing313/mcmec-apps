---
"website-management": patch
"@mcmec/ui": patch
---

Order the municipality picker by name, and let it be searched by name

The spray-mission form listed municipalities in whatever order the collection happened to hold
them — Electric's sync order, which is neither stable nor meaningful to someone looking for
"Woodbridge". Both the create and edit routes now `orderBy` the municipality name, the way every
other lookup select in the app already does.

Searching that list did not work at all. `MultiComboboxInput` gives each `CommandItem` the
option's id as its `value`, and cmdk filters on exactly that — so typing a municipality's name
into "Search municipalities..." matched a list of uuids and emptied the popover. The label is now
passed as `keywords`, which is what cmdk filters against in addition to the value, so the id stays
the thing the item is keyed and toggled by.

`ComboboxInput`, the single-select, had the same bug and takes the same fix. `keywords` is a
separate argument to cmdk's filter and never reaches `onSelect`, which still receives the
resolved value — the id. That matters because this is the picker behind Notice Type, Document
Type and the insecticide select, all of which were being searched against uuids too.

The insecticide query on both spray-mission routes is ordered as well. It sat four lines above
the municipality one, with the same defect, on the same form.
