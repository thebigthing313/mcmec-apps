---
"public": patch
---

Point Prevention At Home at the Commission's prevention guide

The front door's "Prevention At Home" tile promised advice on removing habitats, applying
repellents and avoiding bites, and delivered the mosquito source checklist route instead. It now
opens the Commission's prevention document on SharePoint, which is the material the tile
describes.

`Destination` gains an optional `external` flag, and `DestinationCell` renders an anchor with
`target="_blank"` and `rel="noopener noreferrer"` for those rather than a router `Link` — the
router would otherwise try to match an off-site URL against the route tree. The cell's classes
and contents are shared by both branches, so the six tiles stay identical in appearance and
focus behaviour.
